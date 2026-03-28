"""Search engine — finds the most relevant chunks for a question.

In production RAG systems, this would use "embeddings" — turning text
into numbers (vectors) that capture meaning, then finding chunks whose
vectors are closest to the question's vector. That requires a separate
AI model and a vector database.

For our project, we use a simpler but still effective approach:
keyword matching with TF-IDF-style scoring. It looks at which words
appear in your question, finds chunks that contain those words, and
ranks them by how relevant they seem. It's not as smart as embeddings
but it works surprisingly well and doesn't cost anything extra.

Think of it like a book's index vs a librarian. The index (our approach)
finds pages that contain the exact words you're looking for. A librarian
(embeddings) understands what you MEAN and can find relevant pages even
if they use different words. Both work, the librarian is just smarter.
"""

import math
import re
from collections import Counter


# Common words to ignore when searching (they appear everywhere and aren't useful)
STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "don", "now", "and", "but", "or", "if", "while", "this", "that",
    "these", "those", "i", "me", "my", "we", "our", "you", "your",
    "he", "him", "his", "she", "her", "it", "its", "they", "them", "their",
    "what", "which", "who", "whom", "about", "up",
}


def tokenize(text: str) -> list[str]:
    """Break text into lowercase words, removing punctuation and stop words."""
    words = re.findall(r'\b[a-z]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]


def search_chunks(query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
    """Find the most relevant chunks for a query.
    
    Uses TF-IDF-inspired scoring:
    - TF (Term Frequency): How often query words appear in a chunk
    - IDF (Inverse Document Frequency): Words that appear in fewer chunks
      are weighted higher (they're more distinctive)
    
    Args:
        query: The user's question
        chunks: List of dicts with 'text', 'source', 'chunk_index' keys
        top_k: How many results to return
    
    Returns:
        Top matching chunks, sorted by relevance score
    """
    if not chunks or not query.strip():
        return []

    query_tokens = tokenize(query)
    if not query_tokens:
        return chunks[:top_k]

    # Calculate IDF — how rare each word is across all chunks
    num_chunks = len(chunks)
    doc_freq = Counter()
    chunk_token_lists = []

    for chunk in chunks:
        tokens = set(tokenize(chunk["text"]))
        chunk_token_lists.append(tokens)
        for token in tokens:
            doc_freq[token] += 1

    idf = {}
    for token in query_tokens:
        df = doc_freq.get(token, 0)
        idf[token] = math.log((num_chunks + 1) / (df + 1)) + 1

    # Score each chunk
    scored = []
    for i, chunk in enumerate(chunks):
        chunk_tokens = tokenize(chunk["text"])
        token_counts = Counter(chunk_tokens)
        total_tokens = len(chunk_tokens) if chunk_tokens else 1

        score = 0
        matched_terms = []
        for token in query_tokens:
            tf = token_counts.get(token, 0) / total_tokens
            score += tf * idf.get(token, 1)
            if token_counts.get(token, 0) > 0:
                matched_terms.append(token)

        # Bonus for matching multiple query terms
        if len(matched_terms) > 1:
            score *= (1 + 0.2 * len(matched_terms))

        if score > 0:
            scored.append({
                **chunk,
                "score": round(score, 4),
                "matched_terms": matched_terms,
            })

    # Sort by score, return top results
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
