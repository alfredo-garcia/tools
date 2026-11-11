"""
Reserva automática de clases en Smart (Schoolpack / GeneXus).

Reglas (v1):
  - Reserva para el día siguiente (se ejecuta lunes -> martes, miércoles -> jueves).
  - Slots deseados: 07:30, 09:00, 10:30. Si uno no está disponible, reserva los demás.
  - Toma siempre la siguiente clase "Pendiente". Si es un QUIZ no la reserva ni reserva
    nada más (los quizzes se agendan a mano).
  - Idempotente: si ya hay clases programadas ese día en un slot, no lo repite.
  - Notifica el resultado por Telegram.

Variables de entorno:
  SMART_USER, SMART_PASS             credenciales del portal
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  (opcional) notificación
  DRY_RUN=1                          hace todo menos pulsar "Confirmar"
  WAIT_UNTIL=06:00                   (opcional) espera hasta esa hora de Bogotá antes de reservar
  TARGET_DATE=dd/mm/yy               (opcional) fuerza el día a reservar
  ONLY_SLOTS=07:30,09:00             (opcional) reserva solo esos slots (por defecto los tres)
  CANCEL=1                           en vez de reservar, cancela las clases (no quizzes) del día objetivo
  QUIET_IF_NOOP=1                    no avisa por Telegram si no había nada que hacer
  SHOTS_DIR=.                        (opcional) carpeta donde dejar capturas (error.png, final.png)
"""
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from playwright.sync_api import sync_playwright

BASE = "https://schoolpack.smart.edu.co/idiomas/alumnos.aspx"
TZ = ZoneInfo("America/Bogota")
SLOTS = ["07:30", "09:00", "10:30"]
SEDE_CLASES = "59"
SEDES = {"59": "Manizales", "70": "Quizzes/Exámenes"}  # ids del selector #vREGCONREG
FILTER_PENDIENTES = "2"
FILTER_PROGRAMADAS = "3"

# Columnas de la grilla de clases (wv0613): 3 Nivel, 4 Clase Nro., 5 Descripción, 10 Estado, 11 Fecha
COL_DESC, COL_ESTADO, COL_FECHA = 5, 10, 11
# Columna de la grilla de slots (wv0614a): 2 = hora inicial
COL_HORA = 2

# Texto que, si aparece en la fila de un slot, indica que no tiene cupo. Aún no se ha visto
# un slot lleno: la fila completa se loguea para poder afinar esto.
FULL_HINT = re.compile(r"llen|agotad|sin\s+cupo|no\s+disponible|cupo\s*:?\s*0\b", re.I)

QUIZ_SKIP = "la siguiente pendiente es un quiz: no se reserva"

DRY_RUN = os.getenv("DRY_RUN", "0") == "1"
QUIET_IF_NOOP = os.getenv("QUIET_IF_NOOP", "0") == "1"
SHOTS_DIR = Path(os.getenv("SHOTS_DIR", "."))
log_lines: list[str] = []
dialogs: list[str] = []
stage = "arrancar"  # qué estaba haciendo el script; se usa para explicar los errores


def etapa(txt: str) -> None:
    """Anota qué intenta hacer el script, para explicar un error en lenguaje claro."""
    global stage
    stage = txt


def explain(e: Exception) -> str:
    """Error técnico -> frase legible. El detalle completo queda en el log del run."""
    first = re.split(r"\n=+ logs =+|\nCall log:", str(e))[0].strip().splitlines()
    detail = first[0][:150] if first else ""
    if type(e).__name__ == "TimeoutError":
        return f"el portal no respondió a tiempo mientras intentaba {stage}"
    if isinstance(e, RuntimeError) and detail:
        return detail
    return f"error inesperado al {stage} ({type(e).__name__}: {detail})"


def portal_message(frame) -> str:
    """Texto útil de un popup: sin selectores (listas de sedes), grillas ni etiquetas fijas."""
    try:
        text = frame.evaluate(
            """() => {
                const skip = new Set(['SELECT', 'OPTION', 'SCRIPT', 'STYLE']);
                const out = [];
                const walk = (n) => {
                    if (n.nodeType === 3) { const t = n.textContent.trim(); if (t) out.push(t); return; }
                    if (n.nodeType !== 1 || skip.has(n.tagName) || n.id === 'Grid1ContainerTbl') return;
                    const st = getComputedStyle(n);
                    if (st.display === 'none' || st.visibility === 'hidden') return;
                    n.childNodes.forEach(walk);
                };
                walk(document.body);
                return out.join(' ');
            }"""
        )
    except Exception:
        return ""
    text = re.sub(r"Selección de Clases|Sede:|Día:|Confirmar|Regresar", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:120]


def log(msg: str) -> None:
    line = f"[{datetime.now(TZ):%H:%M:%S}] {msg}"
    print(line, flush=True)
    log_lines.append(msg)


def notify(text: str) -> None:
    token, chat = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return
    data = urllib.parse.urlencode({"chat_id": chat, "text": text[:4000]}).encode()
    try:
        urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data, timeout=20)
    except Exception as e:  # la notificación nunca debe tumbar la ejecución
        print(f"Telegram error: {e}")


def screenshot(page, name: str) -> None:
    try:
        page.screenshot(path=str(SHOTS_DIR / name), full_page=True)
    except Exception as e:
        print(f"No se pudo guardar {name}: {e}")


def target_date() -> str:
    forced = os.getenv("TARGET_DATE")
    if forced:
        return forced
    return (datetime.now(TZ) + timedelta(days=1)).strftime("%d/%m/%y")


def wait_until(hhmm: str | None) -> None:
    if not hhmm:
        return
    now = datetime.now(TZ)
    h, m = map(int, hhmm.split(":"))
    t = now.replace(hour=h, minute=m, second=0, microsecond=0)
    secs = (t - now).total_seconds()
    if 0 < secs < 3 * 3600:
        log(f"Esperando {int(secs)} s hasta las {hhmm}…")
        time.sleep(secs)


def norm_hour(text: str) -> str | None:
    """'7:30', '07:30', '07:30 AM' -> '07:30' (None si no hay hora)."""
    m = re.search(r"\b(\d{1,2}):(\d{2})\b", text)
    return f"{int(m.group(1)):02d}:{m.group(2)}" if m else None


# Slots que esta ejecución debe reservar (ONLY_SLOTS=07:30 -> solo ese; vacío -> los tres)
WANTED = [h for h in (norm_hour(x) for x in os.getenv("ONLY_SLOTS", "").split(",")) if h in SLOTS] or SLOTS
CANCEL = os.getenv("CANCEL", "0") == "1"


# --- Grillas GeneXus -------------------------------------------------------------------

def grid_rows(frame, grid_id: str = "Grid1ContainerTbl") -> list[tuple[int, list[str]]]:
    """Filas de datos de la grilla como (índice real de <tr>, textos de celda).

    Se descarta la cabecera y cualquier fila sin celdas de datos (filas vacías o de "sin registros"),
    pero se conserva el índice real del <tr> para poder hacer clic en la fila correcta.
    """
    return frame.evaluate(
        """(id) => {
            const g = document.getElementById(id);
            if (!g) return [];
            return [...g.rows].map((r, i) => [i, [...r.cells].map(c => c.innerText.trim())])
                .slice(1)
                .filter(([, cells]) => cells.length > 2 && cells.some(t => t));
        }""",
        grid_id,
    )


def grid_signature(frame, grid_id: str = "Grid1ContainerTbl") -> str:
    try:
        return frame.evaluate(
            "(id) => { const g = document.getElementById(id); return g ? g.innerText : '<sin grilla>'; }",
            grid_id,
        )
    except Exception:  # el frame se está recargando
        return "<recargando>"


def settle(frame, grid_id: str = "Grid1ContainerTbl", min_ms: int = 800, max_ms: int = 15000) -> None:
    """Espera a que la grilla deje de cambiar tras una llamada AJAX de GeneXus."""
    page = frame.page
    page.wait_for_timeout(min_ms)
    deadline = time.monotonic() + max_ms / 1000
    last, stable = None, 0
    while time.monotonic() < deadline:
        sig = grid_signature(frame, grid_id)
        stable = stable + 1 if sig == last and sig != "<recargando>" else 0
        if stable >= 3:
            return
        last = sig
        page.wait_for_timeout(350)
    log(f"Aviso: la grilla {grid_id} no se estabilizó en {max_ms} ms")


def set_select(frame, sel_id: str, value: str) -> None:
    frame.wait_for_selector(f"#{sel_id}", timeout=15000)
    frame.select_option(f"#{sel_id}", value)
    settle(frame)


def click_row(frame, dom_index: int, col: int, grid_id: str = "Grid1ContainerTbl") -> None:
    frame.locator(f"#{grid_id} tr").nth(dom_index).locator("td").nth(col).click()
    frame.page.wait_for_timeout(500)


def popup(page, level: int, ready: str):
    """Frame del popup gxp{level}; espera a que exista el selector `ready` dentro de él."""
    sel = f"#gxp{level}_ifrm"
    page.wait_for_selector(sel, state="visible", timeout=20000)
    frame = page.query_selector(sel).content_frame()
    frame.wait_for_load_state("domcontentloaded")
    frame.wait_for_selector(ready, timeout=20000)
    return frame


def close_popup(page, frame, level: int) -> None:
    """Pulsa Regresar (BUTTON3) y espera a que el popup desaparezca."""
    try:
        frame.click("input[name=BUTTON3]", timeout=5000)
        page.wait_for_selector(f"#gxp{level}_ifrm", state="detached", timeout=10000)
    except Exception as e:
        log(f"Aviso: no se pudo cerrar el popup {level}: {type(e).__name__}")


def get_prog(page):
    prog = popup(page, 0, "#vTPEAPROBO")
    set_select(prog, "vTPEAPROBO", FILTER_PENDIENTES)
    return prog


# --- Portal ----------------------------------------------------------------------------

def _login_and_open_programar(page):
    etapa("abrir el portal")
    page.goto(BASE, wait_until="domcontentloaded", timeout=45000)
    try:
        page.wait_for_selector("#vUSUCOD", timeout=30000)
    except Exception:
        body = page.evaluate("() => document.body.innerText.slice(0, 200)")
        if re.search(r"cloudflare|just a moment|verify you are human|attention required", body, re.I):
            raise RuntimeError(f"Cloudflare bloquea la IP del runner: {body!r}")
        raise
    etapa("iniciar sesión")
    page.fill("#vUSUCOD", os.environ["SMART_USER"])
    page.fill("#vPASS", os.environ["SMART_PASS"])
    page.click("#BUTTON1")
    # Tras el clic el portal muestra un popup informativo (msje.aspx, #gxp0_ifrm) y no navega
    # hasta cerrarlo con su botón Regresar.
    try:
        page.wait_for_selector("#gxp0_ifrm", state="visible", timeout=15000)
        info = page.query_selector("#gxp0_ifrm").content_frame()
        info.wait_for_selector("input[name=BUTTON1]", timeout=10000)
        info.click("input[name=BUTTON1]")
        page.wait_for_selector("#gxp0_ifrm", state="detached", timeout=10000)
        log("Popup informativo cerrado")
    except Exception:
        pass  # sin popup: se sigue
    page.wait_for_url(re.compile(r"wv0480\.aspx"), wait_until="commit", timeout=30000)
    log("Login OK")
    # El menú son imágenes sin texto: "Programación" es Resources/PROGRAMACION.png
    etapa("abrir Programación")
    page.click("img[src*='PROGRAMACION']", timeout=30000)
    page.wait_for_url(re.compile(r"wv0527\.aspx"), wait_until="commit", timeout=30000)
    # Seleccionar el (único) plan de estudios y pulsar Iniciar
    etapa("elegir tu plan de estudios")
    page.wait_for_selector("#W0030Grid1ContainerTbl tr", timeout=20000)
    page.locator("#W0030Grid1ContainerTbl tr").nth(1).locator("td").locator("visible=true").last.click()
    page.click("#W0030BUTTON1")
    etapa("cargar tus clases")
    return get_prog(page)


def login_and_open_programar(page, tries: int = 3):
    """El portal a veces tarda más de 30 s en responder: se reintenta el flujo de login completo."""
    for n in range(1, tries + 1):
        try:
            return _login_and_open_programar(page)
        except Exception as e:
            if n == tries or type(e).__name__ != "TimeoutError":
                raise
            log(f"Intento {n}/{tries} fallido al {stage} ({type(e).__name__}); reintentando")
            screenshot(page, f"login-intento{n}.png")


def read_programadas(prog, fecha: str) -> list[list[str]]:
    """Clases programadas para `fecha`; deja la grilla otra vez en Pendientes."""
    set_select(prog, "vTPEAPROBO", FILTER_PROGRAMADAS)
    rows = [cells for _, cells in grid_rows(prog)
            if any(c.startswith(fecha) for c in cells)]
    set_select(prog, "vTPEAPROBO", FILTER_PENDIENTES)
    return rows


def slots_of(rows: list[list[str]], fecha: str) -> set[str]:
    """Slots (de SLOTS) ocupados por las filas programadas de `fecha`."""
    taken = set()
    for r in rows:
        for c in r:
            if c.startswith(fecha) and norm_hour(c[len(fecha):]) in SLOTS:
                taken.add(norm_hour(c[len(fecha):]))
    return taken


def nth_pending(prog, skip: int = 0):
    """(índice de <tr>, descripción) de la clase pendiente nº `skip` (0 = la siguiente)."""
    pend = [(i, cells) for i, cells in grid_rows(prog)
            if len(cells) > COL_ESTADO and cells[COL_ESTADO].lower() == "pendiente"]
    if len(pend) <= skip:
        return None, None
    i, cells = pend[skip]
    return i, cells[COL_DESC]


def book_one(page, prog, fecha: str, slot: str, skip: int):
    """Reserva la primera pendiente en fecha/slot. Devuelve (ok, descripcion, motivo).

    `skip` solo se usa en DRY_RUN: describe las pendientes que ya "habríamos reservado". El portal
    solo deja asignar la primera pendiente, así que el clic se hace siempre sobre ella.
    """
    idx, _ = nth_pending(prog, 0)
    _, desc = nth_pending(prog, skip)
    if idx is None or desc is None:
        return False, None, "no hay clases pendientes"
    if "QUIZ" in desc.upper():
        return False, desc, QUIZ_SKIP
    etapa("elegir la clase pendiente")
    click_row(prog, idx, COL_DESC)
    prog.click("input[name=BUTTON1]")  # Asignar
    sel = popup(page, 1, "#vREGCONREG")
    etapa(f"elegir la sede {SEDES[SEDE_CLASES]} y el día")
    set_select(sel, "vREGCONREG", SEDE_CLASES)

    sel.wait_for_selector("#vDIA", timeout=15000)
    opts = sel.eval_on_selector("#vDIA", "s => [...s.options].map(o => [o.value, o.text])")
    day = next((v for v, t in opts if fecha in t), None)
    if not day:
        close_popup(page, sel, 1)
        return False, desc, f"el día {fecha} aún no está habilitado (opciones: {[t for _, t in opts]})"
    set_select(sel, "vDIA", day)

    etapa(f"elegir el horario de las {hora(slot)}")
    rows = grid_rows(sel)
    for _, cells in rows:
        log(f"  slot-grid: {cells}")
    match = next(((i, c) for i, c in rows if len(c) > COL_HORA and norm_hour(c[COL_HORA]) == slot), None)
    if match is None:
        close_popup(page, sel, 1)
        return False, desc, "slot no ofertado"
    ridx, cells = match
    if FULL_HINT.search(" ".join(cells)):
        close_popup(page, sel, 1)
        return False, desc, f"slot lleno ({' | '.join(c for c in cells if c)})"
    click_row(sel, ridx, COL_HORA)

    if DRY_RUN:
        close_popup(page, sel, 1)
        return True, desc, "DRY_RUN (no confirmado)"

    etapa(f"confirmar la reserva de las {hora(slot)}")
    n_dialogs = len(dialogs)
    sel.click("input[name=BUTTON1]")  # Confirmar
    try:
        page.wait_for_selector("#gxp1_ifrm", state="detached", timeout=15000)
    except Exception:
        msg = " ".join(dialogs[n_dialogs:]) or portal_message(sel)
        log(f"  popup tras Confirmar: {sel.evaluate('() => document.body.innerText')[:500]!r}")
        screenshot(page, f"no-confirmo-{slot.replace(':', '')}.png")
        close_popup(page, sel, 1)
        return False, desc, "el portal no confirmó la reserva" + (f" (dijo: «{msg[:120]}»)" if msg else " (sin ningún mensaje)")
    page.wait_for_timeout(1500)
    return True, desc, "confirmada"


@dataclass
class Outcome:
    """Qué pasó en la ejecución; de aquí sale el mensaje de Telegram."""
    previas: set[str] = field(default_factory=set)           # slots que ya estaban reservados
    reservadas: list[tuple[str, str | None]] = field(default_factory=list)  # (slot, clase)
    sin_horario: list[str] = field(default_factory=list)     # slots no ofertados / llenos / día no habilitado
    quiz: str | None = None                                  # descripción del quiz que cortó la reserva
    quiz_previo: bool = False                                # ya había un quiz programado ese día
    sin_pendientes: bool = False
    errores: list[tuple[str, str]] = field(default_factory=list)
    canceladas: list[tuple[str, str | None]] = field(default_factory=list)  # modo CANCEL
    cancel_fallos: list[tuple[str, str]] = field(default_factory=list)


def run_slots(page, prog, fecha: str, out: Outcome):
    """Intenta reservar cada slot libre, en orden, hasta topar con un quiz. Devuelve prog."""
    for slot in WANTED:
        if slot in out.previas:
            continue
        try:
            ok, desc, why = book_one(page, prog, fecha, slot, skip=len(out.reservadas) if DRY_RUN else 0)
        except Exception as e:
            # Estado incierto: se reconstruye el flujo desde el login y se comprueba qué quedó programado
            screenshot(page, f"error-{slot.replace(':', '')}.png")
            log(f"{slot}: error {type(e).__name__}: {e}; reiniciando sesión")
            prog = login_and_open_programar(page)
            if slot in slots_of(read_programadas(prog, fecha), fecha):
                ok, desc, why = True, None, "confirmada (verificada tras error)"
            else:
                out.errores.append((slot, explain(e)))
                continue
        log(f"{slot}: {'OK' if ok else 'NO'} {desc or ''} — {why}")
        if ok:
            out.reservadas.append((slot, desc))
        elif why == QUIZ_SKIP:
            out.quiz = desc
            break
        elif desc is None:
            out.sin_pendientes = True
            break
        elif "aún no está habilitado" in why:
            out.sin_horario.append(slot)
            break
        elif why.startswith("slot "):
            out.sin_horario.append(slot)
        else:
            out.errores.append((slot, why))
        prog = get_prog(page)
    return prog


def cancel_day(prog, fecha: str, out: Outcome) -> None:
    """Cancela las clases programadas de `fecha` (menos los quizzes). Con DRY_RUN solo las lista."""
    etapa("leer tus clases programadas")
    set_select(prog, "vTPEAPROBO", FILTER_PROGRAMADAS)

    def del_dia():
        rows = []
        for i, cells in grid_rows(prog):
            f = next((c for c in cells if c.startswith(fecha)), None)
            if f is None:
                continue
            if "QUIZ" in " ".join(cells).upper():
                out.quiz_previo = True  # los quizzes no se cancelan
                continue
            rows.append((i, norm_hour(f[len(fecha):]) or "?", cells[COL_DESC] if len(cells) > COL_DESC else None))
        return rows

    rows = del_dia()
    if DRY_RUN:
        out.canceladas = [(h, d) for _, h, d in rows]
        return
    for _ in range(len(rows)):
        pend = [r for r in del_dia() if (r[1], r[2]) not in out.canceladas]
        if not pend:
            break
        i, h, d = pend[0]
        etapa(f"cancelar la clase de las {hora(h)}")
        click_row(prog, i, COL_DESC)
        prog.click("input[name=BUTTON2]")  # Cancelar (el diálogo de confirmación se acepta solo)
        settle(prog)
        if (h, d) in [(x[1], x[2]) for x in del_dia()]:
            screenshot(prog.page, f"no-cancelo-{h.replace(':', '')}.png")
            out.cancel_fallos.append((h, "el portal no la canceló" + (f" (avisó: «{dialogs[-1][:120]}»)" if dialogs else "")))
            break
        out.canceladas.append((h, d))
    set_select(prog, "vTPEAPROBO", FILTER_PENDIENTES)


DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def hora(slot: str) -> str:
    return slot.lstrip("0")


def clase(desc: str | None) -> str:
    return desc or "clase"


def build_report(fecha: str, out: Outcome) -> tuple[str, bool]:
    """Mensaje legible y si es "silencioso" (no había nada que hacer ni que avisar)."""
    dia = datetime.strptime(fecha, "%d/%m/%y")
    cuando = f"{DIAS[dia.weekday()]} {dia:%d/%m}"
    n = len(out.reservadas)
    lineas = "\n".join(f"• {hora(s)} · {clase(d)}" for s, d in out.reservadas)
    quiet = False

    if n and set(out.previas) | {s for s, _ in out.reservadas} >= set(WANTED) and not out.errores:
        head = f"🟢 Reservadas tus próximas {n} clases" if n > 1 else "🟢 Reservada tu próxima clase"
        body = lineas
    elif n:
        head = f"🟡 Reserva parcial de {n} clase{'s' if n > 1 else ''}"
        body = lineas
        if out.quiz:
            body += f"\n• Te toca presentar Quiz ({out.quiz}) antes de seguir con más clases"
        elif out.errores:
            body += "".join(f"\n• No pude reservar las {hora(sl)}: {m}" for sl, m in out.errores)
        elif out.sin_horario:
            body += "\n• No había más horarios disponibles"
    elif out.errores:
        head = "🔴 No se pudieron reservar clases"
        body = "\n".join(f"• Las {hora(sl)}: {m}" for sl, m in out.errores)
    elif out.quiz or out.quiz_previo:
        head = ("🟡 No pude reservar clases porque tu próxima clase es un Quiz" if out.quiz
                else "🟡 No pude reservar clases porque ese día ya tienes un Quiz")
        body = f"Quiz pendiente: {out.quiz}" if out.quiz else ""
        quiet = True
    elif out.previas and out.previas >= set(WANTED):
        head = ("🔴 No reservé clases porque ya había clases reservadas previamente" if len(WANTED) > 1
                else f"🔴 No reservé las {hora(WANTED[0])} porque ya estaba reservada")
        body = ""
        quiet = True
    elif out.sin_pendientes:
        head = "🔴 No reservé clases porque no te quedan clases pendientes"
        body = ""
    else:
        head = "🔴 No se pudieron reservar clases, no hay horarios disponibles"
        body = ""

    if out.previas and n:
        body += f"\n\nYa tenías reservado: {', '.join(hora(s) for s in sorted(out.previas))}"
    sim = "🧪 SIMULACRO (no se reservó nada)\n" if DRY_RUN else ""
    return f"{sim}{head}\nClases del {cuando}\n\n{body}".rstrip(), quiet


def build_cancel_report(fecha: str, out: Outcome) -> str:
    dia = datetime.strptime(fecha, "%d/%m/%y")
    cuando = f"{DIAS[dia.weekday()]} {dia:%d/%m}"
    n = len(out.canceladas)
    lineas = "\n".join(f"• {hora(s)} · {clase(d)}" for s, d in out.canceladas)
    sim = "🧪 SIMULACRO (no se canceló nada)\n" if DRY_RUN else ""
    verbo = "Se cancelarían" if DRY_RUN else "Canceladas"
    plural = "s" if n != 1 else ""
    if out.cancel_fallos:
        head = f"🔴 No pude cancelar todas las clases" if not n else f"🟡 Cancelación parcial: {n} clase{plural}"
        body = lineas + "".join(f"\n• Las {hora(h)}: {m}" for h, m in out.cancel_fallos)
    elif n:
        head = f"🟢 {verbo} {n} clase{plural}"
        body = lineas
    else:
        head = "🟡 No tenías clases reservadas que cancelar"
        body = ""
    if out.quiz_previo:
        body += "\n\nEl Quiz de ese día no se toca: si quieres cancelarlo, hazlo en el portal."
    return f"{sim}{head}\nClases del {cuando}\n\n{body}".rstrip()


def main() -> int:
    fecha = target_date()
    if os.getenv("ONLY_SLOTS", "").strip() and not {norm_hour(x) for x in os.getenv("ONLY_SLOTS").split(",")} <= set(SLOTS):
        notify(f"🔴 Slot no válido: «{os.getenv('ONLY_SLOTS')}». Usa solo {', '.join(SLOTS)}.")
        return 1
    log(f"{'Cancelando' if CANCEL else 'Reservando'} {WANTED if not CANCEL else ''} para {fecha} {'(DRY RUN)' if DRY_RUN else ''}")
    out = Outcome()
    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1600, "height": 900}, locale="es-CO", timezone_id="America/Bogota")
        # Los diálogos (alert/confirm) de GeneXus se aceptan y se guardan para el informe
        page.on("dialog", lambda d: (dialogs.append(d.message), d.accept()))
        try:
            w = os.getenv("WAIT_UNTIL")
            if w:  # loguea ~2 min antes para que la sesión no caduque esperando
                pre = (datetime.strptime(w, "%H:%M") - timedelta(minutes=2)).strftime("%H:%M")
                wait_until(pre)
            prog = login_and_open_programar(page)
            wait_until(w)

            ya = read_programadas(prog, fecha)
            out.previas = slots_of(ya, fecha)
            out.quiz_previo = any("QUIZ" in " ".join(r).upper() for r in ya)
            if ya:
                log(f"Ya programadas ese día: {len(ya)} ({', '.join(sorted(out.previas)) or '-'})")
            if CANCEL:
                cancel_day(prog, fecha, out)
                text, quiet = build_cancel_report(fecha, out), False
            else:
                if not out.quiz_previo:
                    prog = run_slots(page, prog, fecha, out)
                text, quiet = build_report(fecha, out)
            if dialogs:
                text += "\n\nAvisos del sitio: " + " · ".join(d[:150] for d in dialogs)
            log(text)
            if QUIET_IF_NOOP and quiet and not DRY_RUN:
                log("Nada que hacer: sin aviso por Telegram")
            else:
                notify(text)
            screenshot(page, "final.png")
            return 0
        except Exception as e:
            screenshot(page, "error.png")
            hechas = "".join(f"\n• {hora(s)} · {clase(d)}" for s, d in (out.canceladas if CANCEL else out.reservadas))
            log(f"Error técnico en '{stage}': {type(e).__name__}: {e}")
            dia = datetime.strptime(fecha, "%d/%m/%y")
            text = (f"🔴 No pude {'cancelar' if CANCEL else 'reservar'} las clases del {DIAS[dia.weekday()]} {dia:%d/%m}\n"
                    f"{explain(e).capitalize()}."
                    + (f"\n\nAntes del error sí se {'canceló' if CANCEL else 'reservó'}:{hechas}" if hechas else "")
                    + "\n\nEl detalle técnico está en el log del run (GitHub Actions).")
            notify(text)
            return 1
        finally:
            browser.close()


if __name__ == "__main__":
    sys.exit(main())
