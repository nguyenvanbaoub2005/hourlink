"""Shared building blocks for HourLink's hybrid category classifier."""

from __future__ import annotations

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline


SEMANTIC_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
TEXT_WEIGHT = 0.40
SEMANTIC_WEIGHT = 0.60


def build_text_classifier() -> Pipeline:
    """Word/character TF-IDF followed by Logistic Regression.

    Word n-grams capture explicit skill names while character n-grams make the
    classifier resilient to missing accents, abbreviations and minor typos.
    """

    return Pipeline([
        ('features', FeatureUnion([
            ('word', TfidfVectorizer(ngram_range=(1, 2), strip_accents='unicode')),
            ('char', TfidfVectorizer(
                analyzer='char_wb',
                ngram_range=(3, 5),
                strip_accents='unicode',
                min_df=2,
                # 20k is enough for the Vietnamese typo/no-accent patterns in
                # this dataset while keeping training and API startup within a
                # laptop-friendly memory budget.
                max_features=20000,
            )),
        ])),
        ('clf', LogisticRegression(
            random_state=42,
            C=2.0,
            solver='liblinear',
            max_iter=500,
            n_jobs=1,
            class_weight='balanced',
        )),
    ])


def build_semantic_classifier() -> LogisticRegression:
    """Logistic Regression trained on multilingual sentence embeddings."""

    return LogisticRegression(
        random_state=42,
        C=5.0,
        solver='liblinear',
        max_iter=500,
        n_jobs=1,
        class_weight='balanced',
    )


def blend_probabilities(
    text_classes,
    text_probabilities,
    semantic_classes,
    semantic_probabilities,
    text_weight: float = TEXT_WEIGHT,
    semantic_weight: float = SEMANTIC_WEIGHT,
):
    """Align class columns and combine both classifiers' probabilities."""

    if not np.isclose(text_weight + semantic_weight, 1.0):
        raise ValueError("Hybrid weights must sum to 1")

    classes = np.array(sorted(set(text_classes).union(set(semantic_classes))))
    text_by_class = {value: index for index, value in enumerate(text_classes)}
    semantic_by_class = {value: index for index, value in enumerate(semantic_classes)}

    text_aligned = np.zeros((len(text_probabilities), len(classes)), dtype=float)
    semantic_aligned = np.zeros((len(semantic_probabilities), len(classes)), dtype=float)
    for output_index, category_id in enumerate(classes):
        if category_id in text_by_class:
            text_aligned[:, output_index] = text_probabilities[:, text_by_class[category_id]]
        if category_id in semantic_by_class:
            semantic_aligned[:, output_index] = semantic_probabilities[:, semantic_by_class[category_id]]

    combined = text_weight * text_aligned + semantic_weight * semantic_aligned
    return classes, combined
