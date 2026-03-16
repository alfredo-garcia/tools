import { View, Text, StyleSheet, Pressable } from 'react-native'

/**
 * Native task card. Uses domain shape from GraphQL (taskName, status, dueDate, priority).
 * @tools/shared-planner can be used for task display grouping / status helpers.
 */
export function TaskCard({ task, onPress }) {
  const name = task?.taskName || task?.['Task Name'] || '(untitled)'
  const due = task?.dueDate || task?.['Due Date']
  const status = task?.status
  const priority = task?.priority

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.title}>{name}</Text>
      <View style={styles.meta}>
        {due && <Text style={styles.metaText}>{due}</Text>}
        {priority && <Text style={styles.metaText}>{priority}</Text>}
        {status && <Text style={styles.metaText}>{status}</Text>}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  pressed: { opacity: 0.8 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaText: { fontSize: 12, color: '#666' },
})
