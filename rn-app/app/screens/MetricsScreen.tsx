import React from "react"
import { View, ScrollView, Pressable, ViewStyle, TextStyle } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface MetricsScreenProps extends AppStackScreenProps<"Metrics"> {}

export const MetricsScreen: React.FC<MetricsScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  console.log("MetricsScreen rendering...")

  // Mock metrics data
  const userMetrics = {
    profile: {
      profileViews: 1247,
      matchesThisWeek: 8,
      messagesReceived: 23,
      messagesSent: 31,
    },
    activity: {
      dailyActiveMinutes: 42,
      weeklyGoalsCompleted: 5,
      streakDays: 12,
      totalEvents: 156,
    },
    social: {
      connectionsThisMonth: 15,
      eventsAttended: 7,
      remindersSet: 34,
      healthChecksCompleted: 89,
    },
    growth: {
      profileCompletionScore: 87,
      responseRate: 94,
      averageRating: 4.7,
      totalInteractions: 432,
    }
  }

  const MetricCard = ({ title, value, subtitle, color = colors.tint }: {
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }) => (
    <View style={[themed($metricCard), { borderLeftColor: color }]}>
      <Text style={themed($metricTitle)} text={title} />
      <Text style={[themed($metricValue), { color }]} text={value.toString()} />
      {subtitle && <Text style={themed($metricSubtitle)} text={subtitle} />}
    </View>
  )

  const MetricSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={themed($section)}>
      <Text style={themed($sectionTitle)} text={title} />
      <View style={themed($metricsGrid)}>
        {children}
      </View>
    </View>
  )

  return (
    <Screen 
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      {/* Header */}
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Text style={themed($backButtonText)} text="← Back" />
        </Pressable>
        <Text preset="heading" style={$title} text="My Metrics" />
      </View>
        {/* Profile Metrics */}
        <MetricSection title="Profile Performance">
          <MetricCard 
            title="Profile Views"
            value={userMetrics.profile.profileViews}
            subtitle="This month"
            color={colors.tint}
          />
          <MetricCard 
            title="New Matches"
            value={userMetrics.profile.matchesThisWeek}
            subtitle="This week"
            color={colors.palette.accent500}
          />
          <MetricCard 
            title="Messages Received"
            value={userMetrics.profile.messagesReceived}
            subtitle="Last 7 days"
            color={colors.palette.secondary500}
          />
          <MetricCard 
            title="Messages Sent"
            value={userMetrics.profile.messagesSent}
            subtitle="Last 7 days"
            color={colors.palette.neutral600}
          />
        </MetricSection>

        {/* Activity Metrics */}
        <MetricSection title="Daily Activity">
          <MetricCard 
            title="Active Minutes"
            value={userMetrics.activity.dailyActiveMinutes}
            subtitle="Today"
            color={colors.tint}
          />
          <MetricCard 
            title="Goals Completed"
            value={userMetrics.activity.weeklyGoalsCompleted}
            subtitle="This week"
            color={colors.palette.accent500}
          />
          <MetricCard 
            title="Current Streak"
            value={userMetrics.activity.streakDays}
            subtitle="Days"
            color={colors.palette.secondary500}
          />
          <MetricCard 
            title="Total Events"
            value={userMetrics.activity.totalEvents}
            subtitle="All time"
            color={colors.palette.neutral600}
          />
        </MetricSection>

        {/* Social Metrics */}
        <MetricSection title="Social Engagement">
          <MetricCard 
            title="New Connections"
            value={userMetrics.social.connectionsThisMonth}
            subtitle="This month"
            color={colors.tint}
          />
          <MetricCard 
            title="Events Attended"
            value={userMetrics.social.eventsAttended}
            subtitle="This month"
            color={colors.palette.accent500}
          />
          <MetricCard 
            title="Reminders Set"
            value={userMetrics.social.remindersSet}
            subtitle="Active"
            color={colors.palette.secondary500}
          />
          <MetricCard 
            title="Health Checks"
            value={userMetrics.social.healthChecksCompleted}
            subtitle="Completed"
            color={colors.palette.neutral600}
          />
        </MetricSection>

        {/* Growth Metrics */}
        <MetricSection title="Growth & Quality">
          <MetricCard 
            title="Profile Score"
            value={`${userMetrics.growth.profileCompletionScore}%`}
            subtitle="Completion"
            color={colors.tint}
          />
          <MetricCard 
            title="Response Rate"
            value={`${userMetrics.growth.responseRate}%`}
            subtitle="24hr average"
            color={colors.palette.accent500}
          />
          <MetricCard 
            title="Average Rating"
            value={userMetrics.growth.averageRating}
            subtitle="Out of 5.0"
            color={colors.palette.secondary500}
          />
          <MetricCard 
            title="Total Interactions"
            value={userMetrics.growth.totalInteractions}
            subtitle="All time"
            color={colors.palette.neutral600}
          />
        </MetricSection>

        {/* Summary Box */}
        <View style={themed($summaryBox)}>
          <Text style={themed($summaryTitle)} text="Quick Summary" />
          <Text style={themed($summaryText)} text="You're having a great month! Your profile views are up 23% and you've made 8 new connections. Keep up the momentum by attending more events and completing your daily goals." />
        </View>
    </Screen>
  )
}

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
  paddingBottom: spacing.md,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
  marginRight: spacing.md,
})

const $backButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
  fontWeight: "600",
})

const $title: TextStyle = {
  flex: 1,
  textAlign: "center",
  marginRight: 48, // Offset for back button
}

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.md,
  marginTop: spacing.md,
})

const $metricsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $metricCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 12,
  borderLeftWidth: 4,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})

const $metricTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $metricValue: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 28,
  fontWeight: "700",
  marginBottom: spacing.xs,
})

const $metricSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
})

const $summaryBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  padding: spacing.lg,
  borderRadius: 12,
  marginTop: spacing.md,
  marginBottom: spacing.xl,
  borderWidth: 1,
  borderColor: colors.palette.primary200,
})

const $summaryTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "700",
  color: colors.palette.primary500,
  marginBottom: spacing.sm,
})

const $summaryText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.primary500,
  lineHeight: 20,
})
