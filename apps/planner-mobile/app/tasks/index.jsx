import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useState, useEffect } from 'react'
import { plannerGraphql } from '../../api/plannerApiClient'
import { TaskCard } from '../../components/TaskCard.native'

const TASKS_QUERY = `
  query { tasks { id taskName status dueDate priority } }
`

export default function TasksScreen() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    plannerGraphql(TASKS_QUERY)
      .then((data) => { if (!cancelled) setTasks(data?.tasks ?? []) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Text style={styles.msg}>Loading…</Text>
  if (error) return <Text style={[styles.msg, styles.error]}>{error}</Text>

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        ListEmptyComponent={<Text style={styles.msg}>No tasks</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  msg: { padding: 16, textAlign: 'center' },
  error: { color: 'crimson' },
})
