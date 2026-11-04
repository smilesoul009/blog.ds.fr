import {createDueReviewReminders, createGoalDueReminders} from '#server/utils/notifications'

export default defineTask({
    meta: {
        name: 'plan:remind',
        description: 'Напоминания: «подведите итоги» по периодам плана и сроки целей',
    },
    async run() {
        const reviews = await createDueReviewReminders()
        const goals = await createGoalDueReminders()
        if (reviews || goals) console.log(`[plan:remind] итоги: ${reviews}, сроки целей: ${goals}`)
        return {result: {reviews, goals}}
    },
})
