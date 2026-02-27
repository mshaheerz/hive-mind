
| Test Name | Expected Outcome |
| --- | --- |
| test_empty_file_local | Raises ValueError on empty local file |
| test_null_file_local | Raises TypeError on null `local_file` argument |
| test_large_data_sync | Raises OverflowError if the data exceeds memory limits during sync |

**Integration Tests**

