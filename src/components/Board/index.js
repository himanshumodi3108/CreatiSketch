import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'

import { MENU_ITEMS, SHAPE_TYPES } from "@/constants";
import { actionItemClick } from '@/slice/menuSlice'
import { generateTimestamp } from "@/timestamp";

import { socket } from "@/socket";

const Board = () => {
    const dispatch = useDispatch()
    const canvasRef = useRef(null)
    const drawHistory = useRef([])
    const historyPointer = useRef(0)
    const shouldDraw = useRef(false)
    const isDrawingShape = useRef(false)
    const shapeStart = useRef({ x: 0, y: 0 })
    const isRemoteDrawingActive = useRef(false)
    const lastColorSize = useRef({ color: null, size: null })
    const isLoadingFromStorage = useRef(false) // Track when loading from localStorage
    const hasReceivedRemoteState = useRef(false) // Track if we've received remote state for current room
    const {activeMenuItem, actionMenuItem, currentRoom} = useSelector((state) => state.menu)
    const {color, size} = useSelector((state) => state.toolbox[activeMenuItem])
    const [isInitialized, setIsInitialized] = useState(false)

    // Handler for loading remote canvas state (when joining a collaborative room)
    const handleLoadCanvasState = (event) => {
        if (event.detail.roomId === currentRoom && canvasRef.current) {
            hasReceivedRemoteState.current = true
            isLoadingFromStorage.current = true
            
            const canvas = canvasRef.current;
            // Ensure canvas has dimensions
            if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            const context = canvas.getContext('2d');
            
            try {
                const img = new Image();
                img.onload = () => {
                    // Clear and draw the image to fill the entire canvas
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Update history
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    drawHistory.current = [imageData];
                    historyPointer.current = 0;
                    
                    // Save to localStorage for persistence
                    localStorage.setItem(`creatisketch_canvas_${currentRoom}`, event.detail.canvasState);
                    
                    // Mark loading as complete
                    setTimeout(() => {
                        isLoadingFromStorage.current = false;
                    }, 100);
                };
                img.onerror = (err) => {
                    console.error('Error loading remote canvas state image:', err);
                    isLoadingFromStorage.current = false;
                };
                img.src = event.detail.canvasState;
            } catch (error) {
                console.error('Error loading remote canvas state:', error);
                isLoadingFromStorage.current = false;
            }
        }
    };

    // Set up event listener for remote canvas state
    useEffect(() => {
        window.addEventListener('loadCanvasState', handleLoadCanvasState);
        return () => {
            window.removeEventListener('loadCanvasState', handleLoadCanvasState);
        };
    }, [currentRoom]);

    // Handle request to send canvas state to newly joined user
    useEffect(() => {
        if (!canvasRef.current || currentRoom === 'default') return;

        const handleRequestCanvasState = (data) => {
            // Another user is requesting canvas state - send it if we have content
            try {
                const canvas = canvasRef.current;
                if (canvas) {
                    const dataURL = canvas.toDataURL();
                    // Check if canvas has actual content before sending
                    const img = new Image();
                    img.onload = () => {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.drawImage(img, 0, 0);
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        // Check if canvas has non-white content
                        const hasContent = imageData.data.some((pixel, index) => {
                            if (index % 4 === 3) return false; // Skip alpha channel
                            return pixel !== 255; // Not white
                        });
                        
                        if (hasContent) {
                            socket.emit('sendCanvasState', { 
                                canvasState: dataURL, 
                                requesterId: data.requesterId 
                            });
                        }
                    };
                    img.src = dataURL;
                }
            } catch (error) {
                console.error('Error sending canvas state:', error);
            }
        };

        const handleCanvasStateReceived = (data) => {
            // Received canvas state from another user
            if (data.roomId === currentRoom) {
                window.dispatchEvent(new CustomEvent('loadCanvasState', { 
                    detail: { canvasState: data.canvasState, roomId: data.roomId } 
                }));
            }
        };

        const handleRequestCanvasStateFromUsers = (event) => {
            if (event.detail.roomId === currentRoom) {
                // Request canvas state from other users in the room
                socket.emit('requestCanvasState');
            }
        };

        socket.on('requestCanvasState', handleRequestCanvasState);
        socket.on('canvasStateReceived', handleCanvasStateReceived);
        window.addEventListener('requestCanvasStateFromUsers', handleRequestCanvasStateFromUsers);

        return () => {
            socket.off('requestCanvasState', handleRequestCanvasState);
            socket.off('canvasStateReceived', handleCanvasStateReceived);
            window.removeEventListener('requestCanvasStateFromUsers', handleRequestCanvasStateFromUsers);
        };
    }, [currentRoom]);

    // Load canvas from localStorage on mount and when room changes
    // For collaborative rooms, wait for remote state first
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')
        
        // Reset remote state flag when room changes
        hasReceivedRemoteState.current = false
        
        // Ensure canvas has dimensions before loading
        if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        
        // For collaborative rooms, wait a bit for remote state to arrive
        // For default room, load immediately from localStorage
        const loadDelay = currentRoom === 'default' ? 0 : 1500;
        
        const loadTimer = setTimeout(() => {
            // Only load from localStorage if we haven't received remote state
            if (!hasReceivedRemoteState.current || currentRoom === 'default') {
                try {
                    const savedCanvas = localStorage.getItem(`creatisketch_canvas_${currentRoom}`)
                    if (savedCanvas) {
                        isLoadingFromStorage.current = true
                        const img = new Image()
                        img.onload = () => {
                            // Ensure canvas dimensions are set
                            if (canvas.width === 0 || canvas.height === 0) {
                                canvas.width = window.innerWidth
                                canvas.height = window.innerHeight
                            }
                            
                            // Clear and draw the image to fill the entire canvas
                            context.clearRect(0, 0, canvas.width, canvas.height)
                            // Draw image to fill canvas dimensions (stretch to fit)
                            context.drawImage(img, 0, 0, canvas.width, canvas.height)
                            
                            // Update history with the current canvas state
                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                            drawHistory.current = [imageData]
                            historyPointer.current = 0
                            
                            // Mark loading as complete after a short delay to ensure rendering
                            setTimeout(() => {
                                isLoadingFromStorage.current = false
                            }, 100)
                        }
                        img.onerror = (err) => {
                            console.error('Error loading image from localStorage:', err)
                            // Clear canvas on error
                            context.clearRect(0, 0, canvas.width, canvas.height)
                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                            drawHistory.current = [imageData]
                            historyPointer.current = 0
                            isLoadingFromStorage.current = false
                        }
                        img.src = savedCanvas
                    } else {
                        // Clear canvas if no saved data for this room
                        context.clearRect(0, 0, canvas.width, canvas.height)
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                        drawHistory.current = [imageData]
                        historyPointer.current = 0
                    }
                } catch (error) {
                    console.error('Error loading canvas from localStorage:', error)
                    // Clear canvas on error
                    context.clearRect(0, 0, canvas.width, canvas.height)
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                    drawHistory.current = [imageData]
                    historyPointer.current = 0
                }
            }
            if (!isInitialized) setIsInitialized(true)
        }, loadDelay);
        
        return () => {
            clearTimeout(loadTimer);
        };
    }, [currentRoom, isInitialized])

    // Save canvas to localStorage periodically
    useEffect(() => {
        if (!canvasRef.current || !isInitialized) return
        const interval = setInterval(() => {
            try {
                const canvas = canvasRef.current
                if (canvas) {
                    const dataURL = canvas.toDataURL()
                    localStorage.setItem(`creatisketch_canvas_${currentRoom}`, dataURL)
                }
            } catch (error) {
                console.error('Error saving canvas to localStorage:', error)
            }
        }, 5000) // Save every 5 seconds

        return () => clearInterval(interval)
    }, [currentRoom, isInitialized])

    // Handle action menu items
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
            try {
                // Left click: JPG download with white background
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = canvas.width
                tempCanvas.height = canvas.height
                const tempContext = tempCanvas.getContext('2d')
                
                // Fill with white background
                tempContext.fillStyle = '#FFFFFF'
                tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
                
                // Draw the original canvas on top
                tempContext.drawImage(canvas, 0, 0)
                
                // Download as JPG
                const URL = tempCanvas.toDataURL('image/jpeg', 0.9)
            const anchor = document.createElement('a')
            anchor.href = URL
                anchor.download = `creatisketch-${generateTimestamp()}.jpg`
            anchor.click()
            } catch (error) {
                console.error('Error downloading canvas:', error)
            }
        } 
        else if (actionMenuItem === MENU_ITEMS.UNDO) {
            if(historyPointer.current > 0) {
                historyPointer.current -= 1
            const imageData = drawHistory.current[historyPointer.current]
            context.putImageData(imageData, 0, 0)
            }
        }
        else if (actionMenuItem === MENU_ITEMS.REDO) {
            if(historyPointer.current < drawHistory.current.length - 1) {
                historyPointer.current += 1
            const imageData = drawHistory.current[historyPointer.current]
            context.putImageData(imageData, 0, 0)
            }
        }
        else if (actionMenuItem === MENU_ITEMS.CLEAR) {
            try {
                context.clearRect(0, 0, canvas.width, canvas.height)
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                drawHistory.current = [imageData]
                historyPointer.current = 0
                socket.emit('clearCanvas')
                localStorage.removeItem(`creatisketch_canvas_${currentRoom}`)
            } catch (error) {
                console.error('Error clearing canvas:', error)
            }
        }
        dispatch(actionItemClick(null))
    }, [actionMenuItem, dispatch, currentRoom])

    // Handle config changes - only update local context, ignore remote changes
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        // Only update our own context properties when our local color/size changes
        // Remote users' color changes shouldn't affect our canvas
            context.strokeStyle = color
        context.fillStyle = color
            context.lineWidth = size
        
        // Note: We don't listen to remote changeConfig events here
        // because each user should have their own independent drawing settings
        // Remote config changes are only relevant when they start drawing
    }, [color, size])

    // Handle clear canvas from socket
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        const handleClearCanvas = () => {
            context.clearRect(0, 0, canvas.width, canvas.height)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            drawHistory.current = [imageData]
            historyPointer.current = 0
        }

        socket.on('clearCanvas', handleClearCanvas)

        return () => {
            socket.off('clearCanvas', handleClearCanvas)
        }
    }, [])

    // Handle shape drawing from socket
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        const handleDrawShape = (shapeData) => {
            // Mark that remote drawing is active to prevent canvas restoration race condition
            isRemoteDrawingActive.current = true
            context.strokeStyle = shapeData.color || color
            context.fillStyle = shapeData.color || color
            context.lineWidth = shapeData.size || size

            const { type, startX, startY, endX, endY } = shapeData

            if (type === SHAPE_TYPES.RECTANGLE) {
                const width = endX - startX
                const height = endY - startY
                context.strokeRect(startX, startY, width, height)
            } else if (type === SHAPE_TYPES.CIRCLE) {
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
                context.beginPath()
                context.arc(startX, startY, radius, 0, 2 * Math.PI)
                context.stroke()
            } else if (type === SHAPE_TYPES.LINE) {
                context.beginPath()
                context.moveTo(startX, startY)
                context.lineTo(endX, endY)
                context.stroke()
            }

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            drawHistory.current.push(imageData)
            historyPointer.current = drawHistory.current.length - 1
            // Reset flag after shape is drawn (longer delay for safety)
            setTimeout(() => {
                isRemoteDrawingActive.current = false
            }, 200)
        }

        socket.on('drawShape', handleDrawShape)

        return () => {
            socket.off('drawShape', handleDrawShape)
        }
    }, [color, size])

    // Main drawing logic
    useLayoutEffect(() => {
        if (typeof window === 'undefined' || !canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        // Save current canvas content BEFORE any operations to preserve drawings
        const currentWidth = canvas.width || window.innerWidth
        const currentHeight = canvas.height || window.innerHeight
        let currentCanvasState = null
        
        // Capture current canvas state directly (more reliable than history)
        if (canvas.width > 0 && canvas.height > 0) {
            try {
                currentCanvasState = context.getImageData(0, 0, canvas.width, canvas.height)
            } catch (e) {
                // If canvas is not initialized, use history as fallback
                if (currentWidth > 0 && currentHeight > 0 && drawHistory.current.length > 0 && drawHistory.current[historyPointer.current]) {
                    currentCanvasState = drawHistory.current[historyPointer.current]
                }
            }
        } else if (currentWidth > 0 && currentHeight > 0 && drawHistory.current.length > 0 && drawHistory.current[historyPointer.current]) {
            currentCanvasState = drawHistory.current[historyPointer.current]
        }

        // Set canvas size (only if dimensions changed to avoid clearing)
        const resizeCanvas = () => {
            const newWidth = window.innerWidth
            const newHeight = window.innerHeight
            if (canvas.width !== newWidth || canvas.height !== newHeight) {
                // Save content before resizing
                if (canvas.width > 0 && canvas.height > 0) {
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                    canvas.width = newWidth
                    canvas.height = newHeight
                    // Restore content after resizing (only if there was content)
                    if (imageData && imageData.data.some(pixel => pixel !== 0)) {
                        context.putImageData(imageData, 0, 0)
                    }
                } else {
                    canvas.width = newWidth
                    canvas.height = newHeight
                }
            }
        }
        
        // Only resize if dimensions actually changed
        // Skip resize if we're currently loading from localStorage to prevent interference
        if (!isLoadingFromStorage.current && (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight)) {
            resizeCanvas()
        }
        
        // Restore canvas state ONLY when color/size changes and it's safe to do so
        // This is a delicate operation - we must be very careful not to overwrite active drawings
        const colorSizeChanged = lastColorSize.current.color !== color || lastColorSize.current.size !== size
        const isInitialMount = lastColorSize.current.color === null
        
        // Only restore if:
        // 1. Color/size actually changed (not initial mount)
        // 2. We have a saved state
        // 3. No remote drawing is active (with extra safety margin)
        // 4. Canvas dimensions are valid
        const shouldRestore = currentCanvasState && 
                             colorSizeChanged && 
                             !isInitialMount &&
                             !isRemoteDrawingActive.current &&
                             canvas.width > 0 && 
                             canvas.height > 0
        
        if (shouldRestore) {
            // Use a longer delay to ensure we're not in the middle of any drawing operations
            // This gives remote drawings plenty of time to complete
            setTimeout(() => {
                if (!isRemoteDrawingActive.current && canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d')
                    // Final safety check: only restore if remote drawing is still not active
                    // Double-check to prevent any race conditions
                    if (!isRemoteDrawingActive.current) {
                        ctx.putImageData(currentCanvasState, 0, 0)
                    }
                }
            }, 150) // Longer delay to let any active operations complete safely
        }
        
        // Update last color/size
        lastColorSize.current = { color, size }
        
        // Set current drawing properties
        context.strokeStyle = color
        context.fillStyle = color
        context.lineWidth = size
        
        window.addEventListener('resize', resizeCanvas)

        const beginPath = (x, y) => {
            context.beginPath()
            context.moveTo(x, y)
        }

        const drawLine = (x, y) => {
            context.lineTo(x, y)
            context.stroke()
        }

        const drawShape = (startX, startY, endX, endY, type) => {
            // Restore canvas to last history state
            if (historyPointer.current >= 0 && drawHistory.current[historyPointer.current]) {
                context.putImageData(drawHistory.current[historyPointer.current], 0, 0)
            }

            context.strokeStyle = color
            context.fillStyle = color
            context.lineWidth = size

            if (type === SHAPE_TYPES.RECTANGLE) {
                const width = endX - startX
                const height = endY - startY
                context.strokeRect(startX, startY, width, height)
            } else if (type === SHAPE_TYPES.CIRCLE) {
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
                context.beginPath()
                context.arc(startX, startY, radius, 0, 2 * Math.PI)
                context.stroke()
            } else if (type === SHAPE_TYPES.LINE) {
                context.beginPath()
                context.moveTo(startX, startY)
                context.lineTo(endX, endY)
                context.stroke()
            }
        }

        const getCoordinates = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }
            return { x: e.clientX, y: e.clientY }
        }

        const handleMouseDown = (e) => {
            const coords = getCoordinates(e)
            const isShapeTool = activeMenuItem === MENU_ITEMS.RECTANGLE || 
                               activeMenuItem === MENU_ITEMS.CIRCLE || 
                               activeMenuItem === MENU_ITEMS.LINE

            if (isShapeTool) {
                isDrawingShape.current = true
                shapeStart.current = { x: coords.x, y: coords.y }
            } else {
            shouldDraw.current = true
                beginPath(coords.x, coords.y)
                socket.emit('beginPath', {
                    x: coords.x, 
                    y: coords.y,
                    color: color,
                    size: size,
                    tool: activeMenuItem
                })
            }
        }

        const handleMouseMove = (e) => {
            const coords = getCoordinates(e)
            
            if (isDrawingShape.current) {
                const shapeType = activeMenuItem === MENU_ITEMS.RECTANGLE ? SHAPE_TYPES.RECTANGLE :
                                 activeMenuItem === MENU_ITEMS.CIRCLE ? SHAPE_TYPES.CIRCLE :
                                 SHAPE_TYPES.LINE
                drawShape(shapeStart.current.x, shapeStart.current.y, coords.x, coords.y, shapeType)
            } else if (shouldDraw.current) {
                drawLine(coords.x, coords.y)
                socket.emit('drawLine', {x: coords.x, y: coords.y})
            }
        }

        const handleMouseUp = (e) => {
            const coords = getCoordinates(e)
            
            if (isDrawingShape.current) {
                const shapeType = activeMenuItem === MENU_ITEMS.RECTANGLE ? SHAPE_TYPES.RECTANGLE :
                                 activeMenuItem === MENU_ITEMS.CIRCLE ? SHAPE_TYPES.CIRCLE :
                                 SHAPE_TYPES.LINE
                
                socket.emit('drawShape', {
                    type: shapeType,
                    startX: shapeStart.current.x,
                    startY: shapeStart.current.y,
                    endX: coords.x,
                    endY: coords.y,
                    color: color,
                    size: size
                })

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                drawHistory.current.push(imageData)
                historyPointer.current = drawHistory.current.length - 1
                isDrawingShape.current = false
            } else if (shouldDraw.current) {
            shouldDraw.current = false
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            drawHistory.current.push(imageData)
            historyPointer.current = drawHistory.current.length - 1
            }
        }

        const handleBeginPath = (path) => {
            // Mark that remote drawing is active to prevent canvas restoration race condition
            isRemoteDrawingActive.current = true
            // Use remote user's color/size for their drawing
            if (path.color) context.strokeStyle = path.color
            if (path.size) context.lineWidth = path.size
            beginPath(path.x, path.y)
        }

        const handleDrawLine = (path) => {
            drawLine(path.x, path.y)
            // Reset flag after a longer delay (allows for continuous drawing)
            // This prevents race condition where restoration happens mid-drawing
            clearTimeout(handleDrawLine.timeoutId)
            handleDrawLine.timeoutId = setTimeout(() => {
                isRemoteDrawingActive.current = false
            }, 300) // 300ms delay to allow for continuous strokes and prevent race conditions
        }

        // Right-click handler for PNG download with white background
        const handleContextMenu = (e) => {
            e.preventDefault()
            try {
                // Create a temporary canvas with white background
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = canvas.width
                tempCanvas.height = canvas.height
                const tempContext = tempCanvas.getContext('2d')
                
                // Fill with white background (explicit white color)
                tempContext.fillStyle = '#FFFFFF'
                tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
                
                // Draw the original canvas on top (this preserves all drawings)
                tempContext.drawImage(canvas, 0, 0)
                
                // Download as PNG
                const URL = tempCanvas.toDataURL('image/png')
                const anchor = document.createElement('a')
                anchor.href = URL
                anchor.download = `creatisketch-${generateTimestamp()}.png`
                anchor.click()
            } catch (error) {
                console.error('Error downloading canvas as PNG:', error)
            }
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseUp)
        canvas.addEventListener('contextmenu', handleContextMenu)

        canvas.addEventListener('touchstart', handleMouseDown, { passive: false })
        canvas.addEventListener('touchmove', handleMouseMove, { passive: false })
        canvas.addEventListener('touchend', handleMouseUp)

        socket.on('beginPath', handleBeginPath)
        socket.on('drawLine', handleDrawLine)

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mouseleave', handleMouseUp)
            canvas.removeEventListener('contextmenu', handleContextMenu)

            canvas.removeEventListener('touchstart', handleMouseDown)
            canvas.removeEventListener('touchmove', handleMouseMove)
            canvas.removeEventListener('touchend', handleMouseUp)

            socket.off('beginPath', handleBeginPath)
            socket.off('drawLine', handleDrawLine)
        }
    }, [activeMenuItem, color, size])

    return <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
}

export default Board;
