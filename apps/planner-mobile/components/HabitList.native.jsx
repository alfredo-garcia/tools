import { View, Text, StyleSheet, FlatList } from 'react-native'

/**
 * Native habit list. Uses domain shape from GraphQL (name, description, frequency).
 * @tools/shared-planner habit analytics/domain can be used for grouping or stats.
 */
export function HabitList({ habits = [] }) {
  if (!habits.length) {
    return <Text style={styles.empty}>No habits</Text>
  }
  return (
    <FlatList
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name || item.id}</Text>
          {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
          {item.frequency ? <Text style={styles.meta}>{item.frequency}</Text> : null}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  empty: { padding: 16, textAlign: 'center', color: '#666' },
  card: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 14, color: '#555', marginBottom: 4 },
  meta: { fontSize: 12, color: '#666' },
})
