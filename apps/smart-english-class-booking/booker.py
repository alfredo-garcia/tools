"""
Reserva automática de clases en Smart (Schoolpack / GeneXus).

Reglas (v1):
  - Reserva para el día siguiente (se ejecuta lunes -> martes, miércoles -> jueves).
  - Slots deseados: 07:30, 09:00, 10:30. Si uno no está disponible, reserva los demás.
  - Toma siempre la siguiente clase "Pendiente". Si es un QUIZ, la agenda (sede de
    exámenes) y no reserva más ese día.
  - Idempotente: si ya hay clases programadas ese día en un slot, no lo repite.
  - Notifica el resultado por Telegram.

Variables de entorno:
  SMART_USER, SMART_PASS             credenciales del portal
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  (opcional) notificación
  DRY_RUN=1                          hace todo menos pulsar "Confirmar"
  WAIT_UNTIL=06:00                   (opcional) espera hasta esa hora de Bogotá antes de reservar
  TARGET_DATE=dd/mm/yy               (opcional) fuerza el día a reservar
  SHOTS_DIR=.                        (opcional) carpeta donde dejar capturas (error.png, final.png)
"""
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from playwright.sync_api import sync_playwright

BASE = "https://schoolpack.smart.edu.co/idiomas/alumnos.aspx"
TZ = ZoneInfo("America/Bogota")
SLOTS = ["07:30", "09:00", "10:30"]
SEDE_CLASES = "59"    # MANIZALES
SEDE_QUIZ = "70"      # 2. PROGRAMAR EXÁMENES/QUIZZES/TEST
FILTER_PENDIENTES = "2"
FILTER_PROGRAMADAS = "3"

# Columnas de la grilla de clases (wv0613): 3 Nivel, 4 Clase Nro., 5 Descripción, 10 Estado, 11 Fecha
COL_DESC, COL_ESTADO, COL_FECHA = 5, 10, 11
# Columna de la grilla de slots (wv0614a): 2 = hora inicial
COL_HORA = 2

# Texto que, si aparece en la fila de un slot, indica que no tiene cupo. Aún no se ha visto
# un slot lleno: la fila completa se loguea para poder afinar esto.
FULL_HINT = re.compile(r"llen|agotad|sin\s+cupo|no\s+disponible|cupo\s*:?\s*0\b", re.I)

DRY_RUN = os.getenv("DRY_RUN", "0") == "1"
SHOTS_DIR = Path(os.getenv("SHOTS_DIR", "."))
log_lines: list[str] = []
dialogs: list[str] = []


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

def login_and_open_programar(page):
    page.goto(BASE, wait_until="domcontentloaded", timeout=45000)
    try:
        page.wait_for_selector("#vUSUCOD", timeout=30000)
    except Exception:
        body = page.evaluate("() => document.body.innerText.slice(0, 200)")
        if re.search(r"cloudflare|just a moment|verify you are human|attention required", body, re.I):
            raise RuntimeError(f"Cloudflare bloquea la IP del runner: {body!r}")
        raise
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
    page.click("img[src*='PROGRAMACION']", timeout=30000)
    page.wait_for_url(re.compile(r"wv0527\.aspx"), wait_until="commit", timeout=30000)
    # Seleccionar el (único) plan de estudios y pulsar Iniciar
    page.wait_for_selector("#W0030Grid1ContainerTbl tr", timeout=20000)
    page.locator("#W0030Grid1ContainerTbl tr").nth(1).locator("td").locator("visible=true").last.click()
    page.click("#W0030BUTTON1")
    return get_prog(page)


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

    `skip` solo se usa en DRY_RUN: salta las pendientes que ya "habríamos reservado".
    """
    idx, desc = nth_pending(prog, skip)
    if idx is None:
        return False, None, "no hay clases pendientes"
    is_quiz = "QUIZ" in desc.upper()
    click_row(prog, idx, COL_DESC)
    prog.click("input[name=BUTTON1]")  # Asignar
    sel = popup(page, 1, "#vREGCONREG")
    set_select(sel, "vREGCONREG", SEDE_QUIZ if is_quiz else SEDE_CLASES)

    sel.wait_for_selector("#vDIA", timeout=15000)
    opts = sel.eval_on_selector("#vDIA", "s => [...s.options].map(o => [o.value, o.text])")
    day = next((v for v, t in opts if fecha in t), None)
    if not day:
        close_popup(page, sel, 1)
        return False, desc, f"el día {fecha} aún no está habilitado (opciones: {[t for _, t in opts]})"
    set_select(sel, "vDIA", day)

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

    n_dialogs = len(dialogs)
    sel.click("input[name=BUTTON1]")  # Confirmar
    try:
        page.wait_for_selector("#gxp1_ifrm", state="detached", timeout=15000)
    except Exception:
        msg = sel.evaluate("() => document.body.innerText.slice(0, 300)")
        close_popup(page, sel, 1)
        return False, desc, f"no confirmó: {msg!r} {dialogs[n_dialogs:]}"
    page.wait_for_timeout(1500)
    return True, desc, "confirmada"


def run_slots(page, prog, fecha: str, taken: set[str], results: list[str]):
    """Intenta reservar cada slot libre. Devuelve (prog, nº de slots confirmados/simulados)."""
    done = 0
    for slot in SLOTS:
        if slot in taken:
            results.append(f"{slot}: ya estaba reservada")
            continue
        try:
            ok, desc, why = book_one(page, prog, fecha, slot, skip=done if DRY_RUN else 0)
        except Exception as e:
            # Estado incierto: se reconstruye el flujo desde el login y se comprueba qué quedó programado
            screenshot(page, f"error-{slot.replace(':', '')}.png")
            log(f"{slot}: error {type(e).__name__}: {e}; reiniciando sesión")
            prog = login_and_open_programar(page)
            if slot in slots_of(read_programadas(prog, fecha), fecha):
                ok, desc, why = True, None, "confirmada (verificada tras error)"
            else:
                results.append(f"{slot}: ❌ error {type(e).__name__}: {e}")
                log(results[-1])
                continue
        results.append(f"{slot}: {'✅' if ok else '❌'} {desc or ''} — {why}")
        log(results[-1])
        if ok:
            done += 1
        if ok and desc and "QUIZ" in desc.upper():
            results.append("Era un quiz: no se reservan más clases ese día.")
            break
        if not ok and (desc is None or "aún no está habilitado" in why):
            break
        prog = get_prog(page)
    return prog, done


def main() -> int:
    fecha = target_date()
    log(f"Reservando para {fecha} {'(DRY RUN)' if DRY_RUN else ''}")
    results: list[str] = []
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
            taken = slots_of(ya, fecha)
            quiz_ya = any("QUIZ" in " ".join(r).upper() for r in ya)
            if ya:
                log(f"Ya programadas ese día: {len(ya)} ({', '.join(sorted(taken)) or '-'})")
            done = 0
            if quiz_ya:
                results.append("Ya hay un quiz ese día: no se reserva nada más.")
            else:
                prog, done = run_slots(page, prog, fecha, taken, results)

            final = read_programadas(prog, fecha)
            resumen = "\n".join(" ".join(c for c in r if c)[:120] for r in final) or "(ninguna)"
            completo = quiz_ya or len(taken) + done == len(SLOTS) or any("era un quiz" in r.lower() for r in results)
            status = "OK" if completo else "PARCIAL"
            text = (f"Smart · reservas {fecha} [{status}]{' DRY RUN' if DRY_RUN else ''}\n"
                    + "\n".join(results)
                    + (f"\nAvisos del sitio: {dialogs}" if dialogs else "")
                    + f"\n\nProgramadas ese día:\n{resumen}")
            log(text)
            notify(text)
            screenshot(page, "final.png")
            return 0
        except Exception as e:
            screenshot(page, "error.png")
            text = f"Smart · reservas {fecha} [ERROR]\n{type(e).__name__}: {e}\n" + "\n".join(results)
            log(text)
            notify(text)
            return 1
        finally:
            browser.close()


if __name__ == "__main__":
    sys.exit(main())
