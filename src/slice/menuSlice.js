import { createSlice } from '@reduxjs/toolkit'
import { MENU_ITEMS } from '@/constants'

// Initialize with empty string to avoid hydration mismatch
// Username will be loaded on client side
const initialState = {
    activeMenuItem: MENU_ITEMS.PENCIL,
    actionMenuItem: null,
    currentRoom: 'default',
    userName: '',
    userCount: 1
}

export const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        menuItemClick: (state, action) => {
            state.activeMenuItem = action.payload
        },
        actionItemClick: (state, action) => {
            state.actionMenuItem = action.payload
        },
        setRoom: (state, action) => {
            state.currentRoom = action.payload
        },
        setUserName: (state, action) => {
            state.userName = action.payload
            if (typeof window !== 'undefined') {
                localStorage.setItem('creatisketch_username', action.payload)
            }
        },
        setUserCount: (state, action) => {
            state.userCount = action.payload
        }
    }
})

export const {menuItemClick, actionItemClick, setRoom, setUserName, setUserCount} = menuSlice.actions

export default menuSlice.reducer