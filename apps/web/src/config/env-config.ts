export const config = {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
    defaultTimeout: parseInt(process.env.API_TIMEOUT || "30000"),
};
