// app/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import axios from "axios"
const REFRESH_TOKEN_KEY = 'refresh_token'
const ACCESS_TOKEN_KEY = 'access_token'

// SecureStore options for Android Keystore
const secureStoreOptions = {
  keychainService: 'koko-app-keychain',
  ...(Platform.OS === 'android' && {
    // Android-specific options for Keystore
    encrypt: true,
    authenticatePrompt: 'Authenticate to access secure storage',
    requireAuthentication: false, // Set to true if you want biometric authentication
  }),
}

export const SecureStorage = {
  // Store refresh token securely
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, secureStoreOptions)
      console.log('Refresh token stored securely')
    } catch (error) {
      console.error('Failed to store refresh token:', error)
      throw error
    }
  },

  // Retrieve refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions)
      return token
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error)
      return null
    }
  },

  // Store access token securely
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, secureStoreOptions)
      console.log('Access token stored securely')
    } catch (error) {
      console.error('Failed to store access token:', error)
      throw error
    }
  },

  // Retrieve access token
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions)
      return token
    } catch (error) {
      console.error('Failed to retrieve access token:', error)
      return null
    }
  },

  // Clear refresh token
  async clearRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions)
      console.log('Refresh token cleared')
    } catch (error) {
      console.error('Failed to clear refresh token:', error)
      throw error
    }
  },

  // Clear access token
  async clearAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions)
      console.log('Access token cleared')
    } catch (error) {
      console.error('Failed to clear access token:', error)
      throw error
    }
  },

  // Clear all tokens
  async clearAllTokens(): Promise<void> {
    try {
      await Promise.all([
        this.clearRefreshToken(),
        this.clearAccessToken(),
      ])
      console.log('All tokens cleared')
    } catch (error) {
      console.error('Failed to clear all tokens:', error)
      throw error
    }
  },

  // Check if refresh token exists
  async hasRefreshToken(): Promise<boolean> {
    try {
      const token = await this.getRefreshToken()
      return !!token
    } catch (error) {
      console.error('Failed to check refresh token existence:', error)
      return false
    }
  },

  // Refresh access token using stored refresh token
  async refreshAccessToken(serverUrl: string): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken()
      if (!refreshToken || refreshToken.trim() === '') {
        console.log('No refresh token available or token is empty')
        return null
      }
      
      console.log('Refreshing access token with refresh token:', refreshToken.substring(0, 20) + '...')
      
      // Make API call to refresh access token
      const response = await axios.post(`${serverUrl}/auth/refresh?refreshToken=${refreshToken}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status !== 200) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const data = response.data
      const newAccessToken = data.accessToken || data.idToken

      if (newAccessToken) {
        await this.setAccessToken(newAccessToken)
        console.log('Access token refreshed successfully')
        return newAccessToken
      } else {
        throw new Error('No access token in refresh response')
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      // Clear invalid refresh token
      await this.clearRefreshToken()
      return null
    }
  },
}
