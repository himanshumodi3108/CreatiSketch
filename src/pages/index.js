import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useDispatch } from 'react-redux'
import { setRoom } from '@/slice/menuSlice'
import { socket } from '@/socket'
import Menu from "@/components/Menu"
import Toolbox from "@/components/Toolbox"
import UserName from "@/components/UserName"

// Dynamically import Board component with SSR disabled (canvas requires client-side)
const Board = dynamic(() => import("@/components/Board"), {
  ssr: false
})

// Dynamically import components that depend on socket/room state with SSR disabled
// to prevent hydration errors (socket connection is client-only)
const RoomManager = dynamic(() => import("@/components/RoomManager"), {
  ssr: false
})

const ConnectionStatus = dynamic(() => import("@/components/ConnectionStatus"), {
  ssr: false
})

export default function Home() {
  const dispatch = useDispatch()

  useEffect(() => {
    // Join default room on mount
    socket.emit('joinRoom', { roomId: 'default', create: false })
    
    const handleRoomJoined = (data) => {
      dispatch(setRoom(data.roomId))
    }

    socket.on('roomJoined', handleRoomJoined)

    return () => {
      socket.off('roomJoined', handleRoomJoined)
    }
  }, [dispatch])

  return (
    <>
      <ConnectionStatus />
      <RoomManager />
      <UserName />
      <Menu />
      <Toolbox />
      <Board />
    </>
  )
}
