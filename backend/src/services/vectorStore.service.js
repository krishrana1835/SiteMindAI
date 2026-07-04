let vectorDatabase = [];

export function storeChunks(chunks) {
    vectorDatabase.push(...chunks);
}

export function getAllChunks() {
    return vectorDatabase;
}

export function clearDatabase() {
    vectorDatabase = [];
}