/** صفحه‌ی تست فقط وقتی فعال است که ENABLE_TEST_PAGE=true باشد. */
export const testEnabled = () => process.env.ENABLE_TEST_PAGE === "true";
