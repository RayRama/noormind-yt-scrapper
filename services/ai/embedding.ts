import axios, { AxiosError } from "axios";
import { EMBEDDING_ENDPOINT } from "../../config/urls";

export async function embedText(text: string) {
  try {
    const response = await axios.post(
      EMBEDDING_ENDPOINT,
      {
        input: [text],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status < 200 || response.status >= 300) {
      console.error(
        `Embedding API request failed with status ${
          response.status
        }: ${JSON.stringify(response.data)}`
      );
      return [];
    }

    return response.data.embeddings;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      `Embedding API error: ${axiosError.message}`,
      axiosError.response?.status,
      axiosError.response?.data
    );
    return [];
  }
}
