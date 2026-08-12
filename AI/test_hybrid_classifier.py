import unittest

import numpy as np

from hybrid_classifier import blend_probabilities


class HybridClassifierTest(unittest.TestCase):
    def test_blend_aligns_different_class_order(self):
        classes, probabilities = blend_probabilities(
            np.array([1, 2]),
            np.array([[0.8, 0.2]]),
            np.array([2, 1]),
            np.array([[0.7, 0.3]]),
        )

        np.testing.assert_array_equal(classes, np.array([1, 2]))
        np.testing.assert_allclose(probabilities, np.array([[0.5, 0.5]]))

    def test_blend_rejects_invalid_weights(self):
        with self.assertRaises(ValueError):
            blend_probabilities(
                np.array([1]), np.array([[1.0]]),
                np.array([1]), np.array([[1.0]]),
                text_weight=0.7, semantic_weight=0.7,
            )


if __name__ == '__main__':
    unittest.main()
