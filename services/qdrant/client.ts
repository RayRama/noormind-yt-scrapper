import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_URL } from "../../config/urls";

// Gunakan URL dari konfigurasi
const client = new QdrantClient({
  url: QDRANT_URL,
});

export default client;
