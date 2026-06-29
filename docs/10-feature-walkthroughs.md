# 10 — Feature Walkthroughs

> Back to [README](./README.md) · Previous: [API Reference](./09-api-reference.md)

---

## Multi-Image Product Listing (Create)

```mermaid
sequenceDiagram
  participant User
  participant SellItem as SellItem.jsx
  participant ImageUploader
  participant API as Express
  participant Multer
  participant Storage as imageStorage.js
  participant Cloud as Cloudinary
  participant DB as MongoDB
  
  User->>SellItem: Fill title, description, price, category
  User->>ImageUploader: Select up to 8 photos
  ImageUploader->>ImageUploader: Preview via URL.createObjectURL()
  User->>SellItem: Submit
  SellItem->>SellItem: Validate phone exists
  SellItem->>SellItem: Build FormData
  SellItem->>API: POST /api/products (multipart)
  API->>Multer: Parse files to memory buffers
  Multer->>API: req.files (max 8, 5MB each)
  API->>API: Validate all required fields
  API->>Storage: saveUploadedFiles(files)
  Storage->>Cloud: upload_stream for each file
  Cloud-->>Storage: secure_url per file
  Storage-->>API: imageUrls array
  API->>DB: Product.create({ imageUrls, ... })
  DB->>DB: pre-save: sync imageUrl = imageUrls[0]
  DB-->>API: Product document
  API-->>SellItem: 201 with formatted product
  SellItem->>User: Navigate to product page
```

---

## Multi-Image Product Listing (Edit)

The edit flow involves a sophisticated image reconciliation:

1. Frontend sends `keepImages` (JSON array of existing URLs to retain) + new `images[]` files.
2. Backend merges: `nextImages = [...parseKeepImages(body), ...saveUploadedFiles(files)]`.
3. Calculates removed: `previousImages.filter(url => !nextImages.includes(url))`.
4. Deletes removed images from Cloudinary/disk.
5. Validates at least 1 and at most 8 images total.

---

## Item Request → Contact → Chat Flow

```mermaid
sequenceDiagram
  participant Requester
  participant Provider
  participant API
  participant DB as MongoDB
  participant Email as Resend
  
  Requester->>API: POST /api/requests { title, description, category }
  API->>DB: ItemRequest.create()
  
  Note over Provider: Sees request on noticeboard
  Provider->>API: POST /api/requests/:id/contact
  API->>DB: Check RequestContact doesn't exist (unique index)
  API->>DB: Create Message (auto text: "I have X. Let's discuss")
  API->>DB: Create RequestContact { provider, requester, initialMessage }
  API->>DB: NotificationQueue.create() for requester
  API-->>Provider: { conversationUrl, requesterId }
  Provider->>Provider: Navigate to /messages?request=...&user=...
  
  Note over Requester: Opens inbox, sees new conversation
  Requester->>Provider: Reply in chat
```

---

## Optimistic Wishlist

```mermaid
sequenceDiagram
  participant User
  participant UI as ProductCard/Detail
  participant Context as AuthContext
  participant API
  participant DB as MongoDB
  
  User->>UI: Click heart icon
  UI->>Context: updateUser({ ...user, wishlist: [..., productId] })
  Note over UI: Heart immediately fills (red)
  UI->>API: POST /api/auth/wishlist/:productId
  API->>DB: user.wishlist.push(productId)
  DB-->>API: { wishlist }
  Note over UI: If API fails, state already shows optimistic result
```

---

## Password Reset Flow

```mermaid
stateDiagram-v2
  [*] --> EnterEmail: User clicks "Forgot Password"
  EnterEmail --> WaitForOTP: Submit email
  WaitForOTP --> EnterOTP: OTP sent (or silent success)
  EnterOTP --> EnterNewPassword: Valid OTP
  EnterOTP --> EnterOTP: Invalid OTP (retry)
  EnterNewPassword --> Success: Strong password submitted
  Success --> [*]: Redirect to login
```

Anti-enumeration: Always returns "If an account exists, a code has been sent" regardless of whether the email exists.

---

*Next: [Image Storage System →](./11-image-storage.md)*
