  ![Journify](https://github.com/1Hui57/Journify/blob/develop/public/Journify-structure.jpg)

# Journify 旅雀

- [Introduction](#introduction)
- [What Can You Do with Journify?](#what-can-you-do-with-journify)
- [Techniques](#techniques)
- [Features](#features)
- [Key Features & Highlights](#key-features--highlights)
- [Contact](#contact)

## Introduction

Journify is a travel planning platform designed for passionate travelers. Easily create your own personalized itinerary, or share your thoughtfully crafted journeys to inspire others. Discover popular trips and start building your perfect adventure today!

**_Link：_**[https://journify-olive.vercel.app/](https://journify-olive.vercel.app/)

- Test account : test@test.com
- Test password : test123

## What Can You Do with Journify?

- **Plan Your Trips:** Create and customize your own travel itineraries day by day.
- **Explore Destinations:** Discover popular countries and trending trips from other users.
- **Save and Like Trips:** Bookmark your favorite trips and show appreciation by liking them.
- **Interactive Maps:** Use Google Maps to search for attractions and visualize your journey.
- **Personal Profile:** Manage your account, upload a profile photo, and set a nickname.
- **Share Your Experience:** Make your trips public to inspire others or keep them private for personal use.

## Techniques

### Front-End
- **Next.js**
  - App Router
- **React**
  - React Hooks：`useState`, `useReducer`, `useEffect`, `useContext`, `useRef`
  - Redux 
    - `useSelector`, `useDispatch`
  - Custom Hooks
    - `useUserData`：Loads and provides user profile information.
    - `useAuth`：Checks if you are signed in and manages authentication.
    - `useGoogleMaps`：Ensures Google Maps is ready before you use map features.
  - React Context
- **TypeScript**
- **Tailwind CSS**

### Back-End
- **Firebase**
  - Firestore Database
  - Storage
  - Authentication

### Third-Party
- **Redux**
- **Google Map Platform APIs**
  - Maps JavaScript API
  - Places API
  - Distance Matrix API
  - Direction API
- **React Day Picker**
- **react-resizable-panels**



## Features

### Home, Country & User Page
- **Explore & Navigate the Platform:**
  - Start from the homepage to browse featured trips, explore specific countries, or visit the profile pages of trip creators to see all their shared journeys.

  ![Explore & Navigate the Platform](https://github.com/1Hui57/Journify/blob/develop/public/%E5%9F%BA%E6%9C%AC%E6%93%8D%E4%BD%9C.gif)

- **Like & Save Your Favorite Trips**
  - Like trips to support creators and save your favorites to view later on your profile.
  ![Like & Save Your Favorite Trips](https://github.com/1Hui57/Journify/blob/develop/public/%E6%97%85%E7%A8%8B%E6%94%B6%E8%97%8F%E8%88%87%E6%84%9B%E5%BF%83.gif)

### Trip

- **Create a Trip**
  - Click **建立旅程** to add a new journey. Set your destination, dates, and details.

  ![Create a Trip](https://github.com/1Hui57/Journify/blob/develop/public/%E5%BB%BA%E7%AB%8B%E6%97%85%E7%A8%8B.gif)

- **Add Attractions**
  - Use the map to search for places and add them to your itinerary.

  ![Add Attractions](https://github.com/1Hui57/Journify/blob/develop/public/%E5%8A%A0%E5%85%A5%E6%99%AF%E9%BB%9E.gif)

- **Customize Your Days**
  - Organize each day, add notes, and adjust your schedule as needed.

  ![Customize Your Days](https://github.com/1Hui57/Journify/blob/develop/public/%E7%B7%A8%E8%BC%AF%E6%99%AF%E9%BB%9E%E8%88%87%E5%A4%A9%E6%95%B8.gif)

  
- **Drag to Resize Editing & Map Panels**
  - Easily adjust the layout of the editing and map sections by dragging the divider.

  ![Drag to Resize Editing & Map Panels](https://github.com/1Hui57/Journify/blob/develop/public/%E6%8B%96%E6%8B%89%E7%B7%A8%E8%BC%AF%E5%8D%80%E5%A1%8A%E8%88%87%E5%9C%B0%E5%9C%96%E4%BD%88%E5%B1%80.gif)
  

- **Edit Trip Details & Share**
  - Update trip information, upload a cover photo, and choose whether to make your trip public or private.

  ![Edit Trip Details & Share](https://github.com/1Hui57/Journify/blob/develop/public/%E7%B7%A8%E8%BC%AF%E6%97%85%E7%A8%8B%E5%9F%BA%E6%9C%AC%E8%B3%87%E8%A8%8A%E8%88%87%E5%85%AC%E9%96%8B.gif)

### Member page
- **Manage Your Profile**
  - Update your photo and nickname in your account settings.

  ![Manage Your Profile](https://github.com/1Hui57/Journify/blob/develop/public/%E6%9C%83%E5%93%A1%E9%A0%81%E7%B7%A8%E8%BC%AF.gif)


## Key Features & Highlights

- **User-friendly design:** Simple navigation and clear instructions.
- **Interactive planning:** Drag and drop attractions, edit times, and add notes.
- **Community inspiration:** See what others are planning and get new ideas.
- **Mobile-friendly:** Works great on phones, tablets, and computers.

## Contact
* **Name:** 周意惠
* **Email:** melody870507@gmail.com