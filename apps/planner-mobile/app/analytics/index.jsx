import { View, Text, StyleSheet } from 'react-native'
import { useState, useEffect } from 'react'
import { plannerGraphql } from '../../api/plannerApiClient'

function getTodayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const SUMMARY_QUERY = `
  query Summary($week: String!) { plannerSummary(week: $week) { week taskCount habitCount mealsCount } }
`

export default function AnalyticsScreen() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const week = getTodayStr()
    let cancelled = false
    plannerGraphql(SUMMARY_QUERY, { week })
      .then((data) => { if (!cancelled) setSummary(data?.plannerSummary ?? null) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Text style={styles.msg}>Loading…</Text>
  if (error) return <Text style={[styles.msg, styles.error]}>{error}</Text>

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary</Text>
      {summary && (
        <View style={styles.row}>
          <Text style={styles.label}>Tasks:</Text>
          <Text style={styles.value}>{summary.taskCount ?? 0}</Text>
        </View>
      )}
      {summary && (
        <View style={styles.row}>
          <Text style={styles.label}>Habits:</Text>
          <Text style={styles.value}>{summary.habitCount ?? 0}</Text>
        </View>
      )}
      {summary && (
        <View style={styles.row}>
          <Text style={styles.label}>Meals (week):</Text>
          <Text style={styles.value}>{summary.mealsCount ?? 0}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  msg: { padding: 16, textAlign: 'center' },
  error: { color: 'crimson' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { marginRight: 8 },
  value: { fontWeight: '600' },
})
