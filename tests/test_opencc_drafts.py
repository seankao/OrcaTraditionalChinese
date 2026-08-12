import unittest

from scripts.generate_opencc_drafts import build_drafts


class OpenCcDraftTests(unittest.TestCase):
    def test_builds_unreviewed_taiwan_drafts_without_modifying_source_fields(self):
        todo = {
            "common.folder": {
                "english": "Folder",
                "simplified": "文件夹",
                "reason": "new",
            },
            "common.unknown": {
                "english": "Unknown",
                "simplified": None,
                "reason": "missing",
            },
        }

        result = build_drafts(todo)

        self.assertEqual(result["common.folder"]["draft"], "資料夾")
        self.assertEqual(result["common.folder"]["reviewStatus"], "unreviewed")
        self.assertEqual(result["common.folder"]["english"], "Folder")
        self.assertEqual(result["common.unknown"]["draft"], "")


if __name__ == "__main__":
    unittest.main()
