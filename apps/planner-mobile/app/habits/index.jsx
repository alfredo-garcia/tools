import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useState, useEffect } from 'react'
import { plannerGraphql } from '../../api/plannerApiClient'
import { HabitList } from '../../components/HabitList.native'

const HABITS_QUERY = `
  query { habits { id name description frequency } }
`

export default function HabitsScreen() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    plannerGraphql(HABITS_QUERY)
      .then((data) => { if (!cancelled) setHabits(data?.habits ?? []) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Text style={styles.msg}>Loading…</Text>
  if (error) return <Text style={[styles.msg, styles.error]}>{error}</Text>

  return (
    <View style={styles.container}>
      <HabitList habits={habits} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  msg: { padding: 16, textAlign: 'center' },
  error: { color: 'crimson' },
})
