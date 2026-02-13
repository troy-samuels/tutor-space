import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { getStudentProgress, getStudentPracticeData } from "@/lib/actions/progress";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentSession, getStudentDisplayName } from "@/lib/auth";
import { AssignmentsPageClient } from "./AssignmentsPageClient";

export const metadata = {
	title: "Assignments | Student Portal",
	description: "Homework and practice in one unified flow.",
};

export default async function StudentAssignmentsPage() {
	const { user, student } = await getStudentSession();

	if (!user) {
		redirect("/student/login?redirect=/student/assignments");
	}

	const studentId = student?.id ?? null;
	const studentName = getStudentDisplayName(student, user);

	const [progressData, practiceData, subscriptionSummaryResult, avatarUrl] =
		await Promise.all([
			getStudentProgress(undefined, studentId ?? undefined),
			getStudentPracticeData(),
			getStudentSubscriptionSummary(),
			getStudentAvatarUrl(),
		]);

	const subscriptionSummary = subscriptionSummaryResult.data;
	const openHomeworkCount = progressData.homework.filter(
		(item) => item.status !== "completed" && item.status !== "cancelled"
	).length;

	return (
		<StudentPortalLayout
			studentName={studentName}
			avatarUrl={avatarUrl}
			subscriptionSummary={subscriptionSummary}
			homeworkCount={openHomeworkCount}
		>
			<AssignmentsPageClient
				homework={progressData.homework}
				practiceAssignments={practiceData.assignments}
				isPracticeSubscribed={practiceData.isSubscribed}
			/>
		</StudentPortalLayout>
	);
}
