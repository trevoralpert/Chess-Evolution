# Adding the Evolution Tree Image

To complete the Evolution Tree button functionality:

1. **Save your Evolution Tree image** to: 
   ```
   public/images/evolution-tree.png
   ```

2. **The image should be** a clear diagram showing:
   - All piece types
   - Evolution paths between pieces
   - Point values for each piece
   - Evolution requirements

3. **Recommended image specs:**
   - Format: PNG (for transparency) or JPG
   - Resolution: At least 1200px wide for clarity
   - File size: Under 2MB for fast loading

## Current Implementation

The buttons are now added to your game:
- **Evolution Tree button** - Shows the evolution tree image in a modal
- **Piece Details button** - Shows formatted piece information in a modal

Both buttons appear in the top-right corner during gameplay and include:
- Smooth fade in/out animations
- Click outside or press Escape to close
- Responsive design for different screen sizes

## Testing

1. Start a game
2. Look for the two buttons in the top-right corner
3. Click "Evolution Tree" - it will show your image (or a placeholder if not found)
4. Click "Piece Details" - it will show the formatted piece information

The Evolution Tree modal will automatically use the EvoChess splash screen as a fallback if the evolution-tree.png file is not found. 