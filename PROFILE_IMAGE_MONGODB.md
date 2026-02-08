# Profile Image Upload with MongoDB GridFS

## Overview

This document describes the implementation of profile image upload functionality where images are stored directly in MongoDB using GridFS instead of the file system. This approach provides better scalability, automatic replication, and easier deployment.

## Architecture

### Backend Implementation

#### 1. MongoDB GridFS Storage
- **Location**: `backend/routes/users.js`
- **Technology**: MongoDB GridFS with bucket name `avatars`
- **Max File Size**: 5MB
- **Supported Formats**: JPEG, JPG, PNG, GIF, WEBP

#### 2. Key Backend Changes

##### User Model (`backend/models/User.js`)
Added new field to store GridFS file reference:
```javascript
avatarFileId: {
  type: String,
  default: null
}
```
Note: The legacy `avatar` field is kept for backward compatibility.

##### Upload Endpoint
**POST** `/api/users/upload-avatar`
- Protected route (requires authentication)
- Accepts multipart/form-data with `avatar` field
- Stores image in GridFS
- Deletes old avatar automatically
- Returns `avatarFileId` on success

**Request:**
```javascript
FormData {
  avatar: File
}
```

**Response:**
```javascript
{
  success: true,
  message: "Avatar uploaded successfully",
  avatarFileId: "507f1f77bcf86cd799439011"
}
```

##### Retrieval Endpoint
**GET** `/api/users/avatar/:fileId`
- Public route (no authentication required)
- Streams image directly from GridFS
- Sets appropriate content-type headers
- Includes cache headers (1 year)

##### User Profile Endpoints
All user profile and authentication endpoints now include `avatarFileId`:
- `/api/auth/login`
- `/api/auth/verify-email/:token`
- `/api/auth/me`
- `/api/auth/reset-password/:token`
- `/api/users/profile` (GET & PUT)

### Frontend Implementation

#### 1. API Utility (`frontend/src/utils/api.js`)

Added `getAvatarUrl()` helper function:
```javascript
export const getAvatarUrl = (user) => {
  if (!user) return null;
  
  // Prefer GridFS avatarFileId
  if (user.avatarFileId) {
    return `${SERVER_URL}/api/users/avatar/${user.avatarFileId}`;
  }
  
  // Fall back to legacy avatar path
  if (user.avatar) {
    return getImageUrl(user.avatar);
  }
  
  return null;
};
```

This function:
- Prioritizes GridFS images (new system)
- Falls back to legacy file system paths (backward compatibility)
- Returns null if no avatar exists

#### 2. Profile Page (`frontend/src/pages/Profile.js`)

**Upload Functionality:**
- File picker with 5MB size limit
- Image format validation
- Loading state during upload
- Error handling with toast notifications
- Immediate UI update after upload

**Display:**
- Uses `getAvatarUrl(user)` to fetch avatar
- Falls back to initials if no avatar exists

#### 3. Navbar (`frontend/src/components/Navbar.js`)

Updated to use `getAvatarUrl(user)` for avatar display in:
- Desktop profile dropdown
- Ensures consistent avatar display across app

## Migration Path

### Backward Compatibility
The system maintains backward compatibility:
1. Old users with file system avatars still work
2. New avatars are stored in MongoDB GridFS
3. When a user uploads a new avatar, they automatically migrate to GridFS

### Migration Strategy
To fully migrate existing users:
1. Keep both `avatar` and `avatarFileId` fields
2. Frontend prioritizes `avatarFileId` if it exists
3. Gradually migrate old file system images to GridFS (optional)

## Benefits of GridFS Approach

### 1. Scalability
- Automatic sharding with MongoDB
- No file system management
- Works seamlessly with replica sets

### 2. Consistency
- All data in one place
- Automatic backups with MongoDB backups
- Transactional consistency

### 3. Deployment
- Easier containerization
- No volume mounting needed for uploads
- Simpler cloud deployments

### 4. Performance
- Chunked streaming for large files
- Built-in caching headers
- Efficient binary data handling

## File Structure

```
backend/
├── models/
│   └── User.js                 # Added avatarFileId field
├── routes/
│   ├── users.js                # GridFS upload/download endpoints
│   └── auth.js                 # Updated to return avatarFileId
└── server.js                   # No changes needed

frontend/
├── src/
│   ├── utils/
│   │   └── api.js              # Added getAvatarUrl() helper
│   ├── pages/
│   │   └── Profile.js          # Updated to use getAvatarUrl()
│   └── components/
│       └── Navbar.js           # Updated to use getAvatarUrl()
```

## API Endpoints Summary

### Upload Avatar
```http
POST /api/users/upload-avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar=<file>
```

### Get Avatar
```http
GET /api/users/avatar/:fileId
```

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>

Response includes:
{
  user: {
    ...
    avatar: "/uploads/avatars/legacy.png",  // Legacy
    avatarFileId: "507f1f77bcf86cd799439011" // New
  }
}
```

## Testing Checklist

- [x] Upload new profile image
- [x] Display uploaded image in profile page
- [x] Display uploaded image in navbar
- [x] File size validation (5MB limit)
- [x] File type validation (images only)
- [x] Old avatar deletion
- [x] Error handling
- [x] Loading states
- [x] Backward compatibility with old avatars
- [x] Cache headers for performance

## Security Considerations

1. **File Size Limit**: 5MB enforced at backend
2. **File Type Validation**: Only image MIME types allowed
3. **Authentication**: Upload requires valid JWT token
4. **Public Access**: Avatar retrieval is public (needed for profile viewing)
5. **Automatic Cleanup**: Old avatars deleted on new upload

## Future Enhancements

1. **Image Optimization**: Add image resizing/compression before upload
2. **Multiple Sizes**: Generate thumbnail, medium, and large versions
3. **CDN Integration**: Serve images through CDN for better performance
4. **Background Migration**: Script to migrate all file system avatars to GridFS
5. **Avatar Gallery**: Allow users to choose from predefined avatars
6. **Crop & Edit**: Add client-side image cropping before upload

## Troubleshooting

### Avatar Not Displaying
1. Check `avatarFileId` exists in user document
2. Verify GridFS bucket is initialized (`gridfsBucket` not null)
3. Check file exists in `avatars.files` collection
4. Verify MongoDB connection is active

### Upload Fails
1. Check file size < 5MB
2. Verify file type is image
3. Ensure user is authenticated
4. Check GridFS bucket initialization
5. Verify MongoDB write permissions

### Old Avatars Not Working
1. Check legacy `avatar` field exists
2. Verify `getAvatarUrl()` fallback logic
3. Ensure file system path is accessible (if not migrated)

## Database Collections

GridFS creates two collections:
- `avatars.files`: Metadata about uploaded images
- `avatars.chunks`: Binary chunks of image data

Query example:
```javascript
db.avatars.files.find({ "metadata.userId": "507f1f77bcf86cd799439011" })
```

## Conclusion

The MongoDB GridFS implementation provides a robust, scalable solution for profile image storage. It maintains backward compatibility while offering improved deployment flexibility and data consistency.

