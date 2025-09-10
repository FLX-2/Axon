use std::process::Command;

#[cfg(test)]
mod startup_path_validation_tests {
    use super::*;

    #[test]
    fn test_startup_maintenance_integration() {
        // This test verifies that startup maintenance can be called without errors
        // and that it properly handles various scenarios
        
        // Note: This is an integration test that doesn't modify the actual registry
        // but tests the logic flow
        
        let output = Command::new("cargo")
            .args(&["test", "--bin", "axon", "startup_manager::tests::test_perform_startup_maintenance"])
            .output()
            .expect("Failed to execute test command");
        
        assert!(output.status.success(), "Startup maintenance test should pass");
    }

    #[test]
    fn test_path_change_detection_integration() {
        // Test that path change detection works in integration scenario
        
        let output = Command::new("cargo")
            .args(&["test", "--bin", "axon", "startup_manager::tests::test_detect_executable_path_change"])
            .output()
            .expect("Failed to execute test command");
        
        assert!(output.status.success(), "Path change detection test should pass");
    }

    #[test]
    fn test_registry_validation_integration() {
        // Test that registry validation works correctly
        
        let output = Command::new("cargo")
            .args(&["test", "--bin", "axon", "startup_manager::tests::test_validate_and_fix_startup_entries"])
            .output()
            .expect("Failed to execute test command");
        
        assert!(output.status.success(), "Registry validation test should pass");
    }
}