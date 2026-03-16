import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Link } from 'expo-router'

export default function PlannerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planner</Text>
      <Link href="/tasks" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Tasks</Text>
        </Pressable>
      </Link>
      <Link href="/habits" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Habits</Text>
        </Pressable>
      </Link>
      <Link href="/analytics" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Analytics</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  link: { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#eee', borderRadius: 8 },
  linkText: { fontSize: 16 },
})
