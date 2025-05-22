import { CustomIconUpload } from './CustomIconUpload';

// In your menu component where you have the "Move to" option:
<div className="absolute right-0 mt-1 bg-surfaceSecondary border border-border rounded shadow-lg">
  {/* Existing menu items */}
  <CustomIconUpload 
    appPath={app.path} 
    onIconUpdate={() => {
      // Refresh the app list or just the specific app's icon
      // You might need to implement this based on your state management
    }} 
  />
  {/* Other menu items */}
</div> 