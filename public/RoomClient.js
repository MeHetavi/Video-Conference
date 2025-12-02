const mediaType = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType'
}
const _EVENTS = {
  exitRoom: 'exitRoom',
  openRoom: 'openRoom',
  startVideo: 'startVideo',
  stopVideo: 'stopVideo',
  startAudio: 'startAudio',
  stopAudio: 'stopAudio',
  startScreen: 'startScreen',
  stopScreen: 'stopScreen'
}

function updateLayout() {
  const remoteContainer = document.getElementById('remoteVideos');
  if (!remoteContainer) return;

  // Get all tiles including local video (all are now in remoteVideos container)
  const allTiles = Array.from(remoteContainer.querySelectorAll('.video-container'));

  // Include all tiles (local + remote) in the grid layout
  const allParticipantTiles = allTiles;

  // Separate pinned and unpinned videos (including local video)
  const pinnedTiles = allParticipantTiles.filter(tile => tile.classList.contains('pinned'));
  const unpinnedTiles = allParticipantTiles.filter(tile => !tile.classList.contains('pinned'));

  // Get screen width for responsive layout
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 640;
  const isTablet = screenWidth > 640 && screenWidth <= 768;
  const isSmallDesktop = screenWidth > 768 && screenWidth <= 1024;

  // Calculate grid layout based on number of participants (including local video)
  // Optimize to minimize empty spaces
  // If there are pinned videos, show them prominently at the top
  const participantCount = allParticipantTiles.length;
  const pinnedCount = pinnedTiles.length;
  const unpinnedCount = unpinnedTiles.length;
  let gridColumns = 1;
  let gridRows = 1;
  let useCustomLayout = false;

  // Responsive column calculation based on screen size
  const getMaxColumns = () => {
    if (isMobile) {
      // Mobile: 1 column for very small, 2 for landscape
      return window.innerHeight > window.innerWidth ? 1 : 2;
    } else if (isTablet) {
      // Tablet: 2-3 columns
      return 2;
    } else if (isSmallDesktop) {
      // Small desktop: 3 columns
      return 3;
    } else {
      // Large desktop: 4 columns
      return 4;
    }
  };

  const maxColumns = getMaxColumns();

  if (participantCount === 0) {
    // No remote participants - show empty grid, local video will be in overlay
    gridColumns = 1;
    gridRows = 1;
    remoteContainer.style.display = 'grid';
    remoteContainer.style.gridTemplateColumns = '1fr';
    remoteContainer.style.gridTemplateRows = '1fr';
    remoteContainer.style.gap = isMobile ? '4px' : '8px';
    remoteContainer.style.padding = isMobile ? '4px' : '8px';
    remoteContainer.style.width = '100%';
    remoteContainer.style.height = '100%';
    remoteContainer.style.minHeight = '0';
    remoteContainer.style.overflow = 'hidden';
  } else if (participantCount === 1) {
    gridColumns = 1;
    gridRows = 1;
  } else if (participantCount === 2) {
    // Small screens: 1 column, 2 rows (one per row)
    if (isMobile) {
      gridColumns = 1;
      gridRows = 2;
    } else {
      gridColumns = Math.min(2, maxColumns);
      gridRows = 1;
    }
  } else if (participantCount === 3) {
    // Small screens: 2 in first row, 1 in second row
    if (isMobile) {
      useCustomLayout = true;
      gridColumns = 2;
      gridRows = 2;
    } else if (maxColumns >= 2) {
      // Larger screens: Special layout: 2 videos in one column (2 rows), 1 video in entire column
      useCustomLayout = true;
      gridColumns = 2;
      gridRows = 2;
    } else {
      // Very small screens: stack all 3 vertically
      gridColumns = 1;
      gridRows = 3;
    }
  } else if (participantCount === 4) {
    // Small screens: 2 in both rows (2x2 grid)
    if (isMobile) {
      gridColumns = 2;
      gridRows = 2;
    } else {
      gridColumns = Math.min(2, maxColumns);
      gridRows = 2;
    }
  } else if (participantCount === 5) {
    // Optimized: 3 videos in first row, 2 videos in second row
    gridColumns = Math.min(3, maxColumns);
    gridRows = 2;
  } else if (participantCount === 6) {
    gridColumns = Math.min(3, maxColumns);
    gridRows = 2;
  } else if (participantCount === 7) {
    // Optimized: 4 videos in first row, 3 videos in second row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 2;
  } else if (participantCount === 8) {
    gridColumns = Math.min(4, maxColumns);
    gridRows = 2;
  } else if (participantCount === 9) {
    gridColumns = Math.min(3, maxColumns);
    gridRows = 3;
  } else if (participantCount === 10) {
    // Optimized: 4 videos in first row, 3 videos in second row, 3 videos in third row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 3;
  } else if (participantCount === 11) {
    // Optimized: 4 videos in first row, 4 videos in second row, 3 videos in third row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 3;
  } else if (participantCount === 12) {
    gridColumns = Math.min(4, maxColumns);
    gridRows = 3;
  } else if (participantCount === 13) {
    // Optimized: 4 videos per row for first 3 rows, 1 video in fourth row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 4;
  } else if (participantCount === 14) {
    // Optimized: 4 videos per row for first 3 rows, 2 videos in fourth row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 4;
  } else if (participantCount === 15) {
    // Optimized: 4 videos per row for first 3 rows, 3 videos in fourth row
    gridColumns = Math.min(4, maxColumns);
    gridRows = 4;
  } else if (participantCount === 16) {
    gridColumns = Math.min(4, maxColumns);
    gridRows = 4;
  } else {
    // For more than 16, use a scrollable grid with responsive columns
    gridColumns = maxColumns;
    gridRows = Math.ceil(participantCount / gridColumns);
    remoteContainer.style.overflowY = 'auto';
    const controlHeight = isMobile ? 70 : 80;
    remoteContainer.style.maxHeight = `calc(100vh - ${controlHeight}px)`;
  }

  // Apply grid layout
  if (participantCount > 0) {
    // For small screens with more than 4 videos, automatically pin first video and show others horizontally
    // Or if there are already pinned videos, use the pinned layout
    if ((isMobile && participantCount > 4 && pinnedCount === 0) || pinnedCount > 0) {
      // Auto-pin first video on mobile if more than 4 videos and no pinned videos
      if (isMobile && participantCount > 4 && pinnedCount === 0) {
        // Automatically pin the first video
        if (allParticipantTiles.length > 0 && !allParticipantTiles[0].classList.contains('pinned')) {
          allParticipantTiles[0].classList.add('pinned');
          // Update pinned/unpinned arrays
          pinnedTiles.push(allParticipantTiles[0]);
          const index = unpinnedTiles.indexOf(allParticipantTiles[0]);
          if (index > -1) {
            unpinnedTiles.splice(index, 1);
          }
          // Update counts
          pinnedCount = pinnedTiles.length;
          unpinnedCount = unpinnedTiles.length;
        }
      }
      // Create two-column layout: pinned video(s) on left, others in scrollable sidebar on right
      // On mobile, stack vertically instead of horizontally
      remoteContainer.style.display = 'flex';
      remoteContainer.style.flexDirection = isMobile ? 'column' : 'row';
      remoteContainer.style.gap = isMobile ? '4px' : '8px';
      remoteContainer.style.padding = isMobile ? '4px' : '8px';
      remoteContainer.style.width = '100%';
      remoteContainer.style.height = '100%';
      remoteContainer.style.minHeight = '0';
      remoteContainer.style.overflow = 'hidden';

      // Create main area for pinned video (only one can be pinned)
      let pinnedArea = remoteContainer.querySelector('.pinned-videos-area');
      if (!pinnedArea) {
        pinnedArea = document.createElement('div');
        pinnedArea.className = 'pinned-videos-area';
        pinnedArea.style.flex = '1';
        pinnedArea.style.minWidth = '0';
        pinnedArea.style.display = 'flex';
        pinnedArea.style.flexDirection = 'column';
        pinnedArea.style.gap = isMobile ? '4px' : '8px';
        pinnedArea.style.overflow = 'hidden';
        if (isMobile) {
          pinnedArea.style.minHeight = '200px';
          pinnedArea.style.maxHeight = '40vh';
        }
        remoteContainer.appendChild(pinnedArea);
      } else {
        pinnedArea.style.flexDirection = 'column';
        pinnedArea.style.gap = isMobile ? '4px' : '8px';
        if (isMobile) {
          pinnedArea.style.minHeight = '200px';
          pinnedArea.style.maxHeight = '40vh';
        } else {
          pinnedArea.style.minHeight = '';
          pinnedArea.style.maxHeight = '';
        }
      }

      // Reset all tiles first to clear any previous layout styles
      allParticipantTiles.forEach(tile => {
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '';
        tile.style.height = '';
        tile.style.minHeight = '';
        tile.style.maxHeight = '';
        tile.style.aspectRatio = '';
        tile.style.flexShrink = '';
      });

      // Clear and add pinned video to main area (only first one if multiple somehow)
      pinnedArea.innerHTML = '';
      if (pinnedTiles.length > 0) {
        const pinnedTile = pinnedTiles[0]; // Only take the first pinned video
        // Reset styles first
        pinnedTile.style.gridArea = '';
        pinnedTile.style.flex = '';
        pinnedTile.style.width = '100%';
        pinnedTile.style.height = '100%';
        pinnedTile.style.minHeight = '0';
        pinnedTile.style.maxHeight = '';
        pinnedTile.style.aspectRatio = '';
        pinnedTile.style.flex = '1';
        pinnedArea.appendChild(pinnedTile);
      }

      // Create sidebar for unpinned videos
      let sidebar = remoteContainer.querySelector('.unpinned-videos-sidebar');
      if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.className = 'unpinned-videos-sidebar';
        // Responsive sidebar width
        if (isMobile) {
          sidebar.style.width = '100%';
          sidebar.style.minWidth = '100%';
          sidebar.style.maxWidth = '100%';
          sidebar.style.borderLeft = 'none';
          sidebar.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.paddingLeft = '0';
          sidebar.style.paddingTop = '8px';
          // Horizontal scrolling on mobile
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'row';
          sidebar.style.overflowX = 'auto';
          sidebar.style.overflowY = 'hidden';
          sidebar.style.gap = '8px';
        } else if (isTablet) {
          sidebar.style.width = '200px';
          sidebar.style.minWidth = '180px';
          sidebar.style.maxWidth = '250px';
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'column';
          sidebar.style.gap = '8px';
          sidebar.style.overflowY = 'auto';
          sidebar.style.overflowX = 'hidden';
          sidebar.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.paddingLeft = '8px';
        } else {
          sidebar.style.width = '300px';
          sidebar.style.minWidth = '250px';
          sidebar.style.maxWidth = '400px';
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'column';
          sidebar.style.gap = '8px';
          sidebar.style.overflowY = 'auto';
          sidebar.style.overflowX = 'hidden';
          sidebar.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.paddingLeft = '8px';
        }
        remoteContainer.appendChild(sidebar);
      } else {
        // Update existing sidebar styles for responsiveness
        if (isMobile) {
          sidebar.style.width = '100%';
          sidebar.style.minWidth = '100%';
          sidebar.style.maxWidth = '100%';
          sidebar.style.borderLeft = 'none';
          sidebar.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.paddingLeft = '0';
          sidebar.style.paddingTop = '8px';
          // Horizontal scrolling on mobile
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'row';
          sidebar.style.overflowX = 'auto';
          sidebar.style.overflowY = 'hidden';
          sidebar.style.gap = '8px';
        } else if (isTablet) {
          sidebar.style.width = '200px';
          sidebar.style.minWidth = '180px';
          sidebar.style.maxWidth = '250px';
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'column';
          sidebar.style.gap = '8px';
          sidebar.style.overflowY = 'auto';
          sidebar.style.overflowX = 'hidden';
          sidebar.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.borderTop = 'none';
          sidebar.style.paddingLeft = '8px';
          sidebar.style.paddingTop = '0';
        } else {
          sidebar.style.width = '300px';
          sidebar.style.minWidth = '250px';
          sidebar.style.maxWidth = '400px';
          sidebar.style.display = 'flex';
          sidebar.style.flexDirection = 'column';
          sidebar.style.gap = '8px';
          sidebar.style.overflowY = 'auto';
          sidebar.style.overflowX = 'hidden';
          sidebar.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
          sidebar.style.borderTop = 'none';
          sidebar.style.paddingLeft = '8px';
          sidebar.style.paddingTop = '0';
        }
      }

      // Clear and add ALL unpinned videos to sidebar (including previously pinned ones)
      sidebar.innerHTML = '';
      unpinnedTiles.forEach(tile => {
        // Reset all styles first
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.aspectRatio = '16/9';
        tile.style.flexShrink = '0';
        if (isMobile) {
          // Horizontal scrolling: fixed width, no height constraint
          tile.style.width = '200px';
          tile.style.minWidth = '200px';
          tile.style.maxWidth = '200px';
          tile.style.height = 'auto';
          tile.style.minHeight = '120px';
          tile.style.maxHeight = '180px';
        } else if (isTablet) {
          tile.style.width = '100%';
          tile.style.minHeight = '140px';
          tile.style.maxHeight = '220px';
          tile.style.height = '';
        } else {
          tile.style.width = '100%';
          tile.style.minHeight = '150px';
          tile.style.maxHeight = '250px';
          tile.style.height = '';
        }
        sidebar.appendChild(tile);
      });

      // Show/hide sidebar based on whether there are unpinned videos
      if (unpinnedCount === 0) {
        sidebar.style.display = 'none';
      } else {
        sidebar.style.display = 'flex';
      }
    } else {
      // No pinned videos, use standard grid layout
      // Remove any sidebar elements if they exist
      const sidebar = remoteContainer.querySelector('.unpinned-videos-sidebar');
      const pinnedArea = remoteContainer.querySelector('.pinned-videos-area');

      // Collect all tiles that need to be moved back
      const tilesToMove = [];

      if (sidebar) {
        const sidebarTiles = Array.from(sidebar.querySelectorAll('.video-container'));
        tilesToMove.push(...sidebarTiles);
      }

      if (pinnedArea) {
        const pinnedTilesToMove = Array.from(pinnedArea.querySelectorAll('.video-container'));
        tilesToMove.push(...pinnedTilesToMove);
      }

      // Move all tiles back to main container and reset their styles
      tilesToMove.forEach(tile => {
        // Reset all styles before moving
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '';
        tile.style.height = '';
        tile.style.minHeight = '';
        tile.style.maxHeight = '';
        tile.style.aspectRatio = '';
        tile.style.flexShrink = '';
        tile.style.maxWidth = '';
        tile.style.minWidth = '';
        remoteContainer.appendChild(tile);
      });

      // Remove sidebar and pinned area
      if (sidebar) {
        sidebar.remove();
      }
      if (pinnedArea) {
        pinnedArea.remove();
      }

      // Get all tiles after moving (including local video)
      const allTilesAfterMove = Array.from(remoteContainer.querySelectorAll('.video-container'));
      const allParticipantTilesAfterMove = allTilesAfterMove;

      // Recalculate grid layout parameters based on actual tile count after moving
      const actualParticipantCount = allParticipantTilesAfterMove.length;
      let actualGridColumns = 1;
      let actualGridRows = 1;
      let actualUseCustomLayout = false;

      if (actualParticipantCount === 0) {
        actualGridColumns = 1;
        actualGridRows = 1;
      } else if (actualParticipantCount === 1) {
        actualGridColumns = 1;
        actualGridRows = 1;
      } else if (actualParticipantCount === 2) {
        if (isMobile) {
          actualGridColumns = 1;
          actualGridRows = 2;
        } else {
          actualGridColumns = Math.min(2, maxColumns);
          actualGridRows = 1;
        }
      } else if (actualParticipantCount === 3) {
        if (isMobile) {
          actualUseCustomLayout = true;
          actualGridColumns = 2;
          actualGridRows = 2;
        } else if (maxColumns >= 2) {
          actualUseCustomLayout = true;
          actualGridColumns = 2;
          actualGridRows = 2;
        } else {
          actualGridColumns = 1;
          actualGridRows = 3;
        }
      } else if (actualParticipantCount === 4) {
        if (isMobile) {
          actualGridColumns = 2;
          actualGridRows = 2;
        } else {
          actualGridColumns = Math.min(2, maxColumns);
          actualGridRows = 2;
        }
      } else if (actualParticipantCount === 5) {
        actualGridColumns = Math.min(3, maxColumns);
        actualGridRows = 2;
      } else if (actualParticipantCount === 6) {
        actualGridColumns = Math.min(3, maxColumns);
        actualGridRows = 2;
      } else if (actualParticipantCount === 7) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 2;
      } else if (actualParticipantCount === 8) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 2;
      } else if (actualParticipantCount === 9) {
        actualGridColumns = Math.min(3, maxColumns);
        actualGridRows = 3;
      } else if (actualParticipantCount === 10) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 3;
      } else if (actualParticipantCount === 11) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 3;
      } else if (actualParticipantCount === 12) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 3;
      } else if (actualParticipantCount === 13) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 4;
      } else if (actualParticipantCount === 14) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 4;
      } else if (actualParticipantCount === 15) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 4;
      } else if (actualParticipantCount === 16) {
        actualGridColumns = Math.min(4, maxColumns);
        actualGridRows = 4;
      } else {
        actualGridColumns = maxColumns;
        actualGridRows = Math.ceil(actualParticipantCount / actualGridColumns);
      }

      // Reset all tile styles before applying grid layout
      allParticipantTilesAfterMove.forEach(tile => {
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '';
        tile.style.height = '';
        tile.style.minHeight = '';
        tile.style.maxHeight = '';
        tile.style.aspectRatio = '';
        tile.style.flexShrink = '';
        tile.style.maxWidth = '';
        tile.style.minWidth = '';
      });

      // Reset container styles completely before applying grid
      remoteContainer.style.display = 'grid';
      remoteContainer.style.flexDirection = '';
      remoteContainer.style.flex = '';
      remoteContainer.style.gridTemplateColumns = `repeat(${actualGridColumns}, 1fr)`;
      remoteContainer.style.gridTemplateRows = `repeat(${actualGridRows}, 1fr)`;
      remoteContainer.style.gap = isMobile ? '4px' : (isTablet ? '6px' : '8px');
      remoteContainer.style.padding = isMobile ? '4px' : (isTablet ? '6px' : '8px');
      remoteContainer.style.width = '100%';
      remoteContainer.style.height = '100%';
      remoteContainer.style.minHeight = '0';
      remoteContainer.style.overflowX = 'hidden';
      remoteContainer.style.overflowY = actualParticipantCount > 16 ? 'auto' : 'hidden';

      // Apply custom layout for 3 participants
      if (actualUseCustomLayout && allParticipantTilesAfterMove.length === 3) {
        if (isMobile) {
          // Mobile: 2 in first row, 1 in second row
          allParticipantTilesAfterMove[0].style.gridArea = '1 / 1 / 2 / 2'; // Top-left
          allParticipantTilesAfterMove[1].style.gridArea = '1 / 2 / 2 / 3'; // Top-right
          allParticipantTilesAfterMove[2].style.gridArea = '2 / 1 / 3 / 3'; // Bottom row, spans both columns
        } else {
          // Desktop: First two videos in left column (stacked), third video takes entire right column
          allParticipantTilesAfterMove[0].style.gridArea = '1 / 1 / 2 / 2'; // Top-left
          allParticipantTilesAfterMove[1].style.gridArea = '2 / 1 / 3 / 2'; // Bottom-left
          allParticipantTilesAfterMove[2].style.gridArea = '1 / 2 / 3 / 3'; // Full right column
        }
      }

      // Apply default grid styles to all tiles
      allParticipantTilesAfterMove.forEach((tile, index) => {
        tile.style.width = '100%';
        tile.style.height = '100%';
        tile.style.minHeight = '0';
        tile.style.maxHeight = '';
        tile.style.flex = '';

        // For 3-video layout on mobile, the bottom video spans 2 columns
        // Remove aspect ratio constraint to let it fill the grid cell properly
        if (actualUseCustomLayout && allParticipantTilesAfterMove.length === 3 && isMobile && index === 2) {
          // Bottom video: let grid cell determine size, video will use object-fit: contain
          tile.style.aspectRatio = '';
        } else {
          tile.style.aspectRatio = '16/9';
        }

        if (!actualUseCustomLayout || allParticipantTilesAfterMove.length !== 3) {
          tile.style.gridArea = '';
        }
      });
    }
  }

  // Style each video tile with base styles (including local video)
  // Layout-specific styles (width, height, aspectRatio) are set in the pinned/unpinned sections above
  allParticipantTiles.forEach(tile => {
    // Always apply base styles
    tile.style.borderRadius = '12px';
    tile.style.overflow = 'hidden';
    tile.style.position = 'relative';
    tile.style.backgroundColor = '#1B4332';

    // Layout-specific styles are already set in the pinned/unpinned sections above
    // Don't override them here
  });

  // Explicitly set the height of the video container to ensure it stays above controls
  // Responsive control height
  const controlHeight = isMobile ? 70 : (isTablet ? 75 : 80);
  const videoMedia = document.getElementById('videoMedia');
  if (videoMedia) {
    videoMedia.style.height = `calc(100vh - ${controlHeight}px)`;
  }
}

function setupNonTrainerLayout(container, tiles) {
  container.classList.add('trainer-layout');

  let trainerTile = null;
  let localTile = null;
  const otherTiles = [];

  tiles.forEach(tile => {
    const isLocal = tile.id && tile.id.includes('local-');
    const overlay = tile.querySelector('.video-overlay');
    const isTrainer = overlay && overlay.querySelector('.video-trainer-badge');

    if (isLocal) {
      localTile = tile;
      tile.classList.add('local-video');
    } else if (isTrainer) {
      trainerTile = tile;
      tile.classList.add('trainer-video');
    } else {
      otherTiles.push(tile);
      tile.classList.add('other-participant');
    }
  });

  const hasTrainer = trainerTile !== null;
  const hasLocal = localTile !== null;
  const totalTopTiles = (hasTrainer ? 1 : 0) + (hasLocal ? 1 : 0);
  const hasOthers = otherTiles.length > 0;

  if (totalTopTiles === 0 && hasOthers) {
    setupGridLayout(container, otherTiles);
    return;
  }

  container.innerHTML = '';

  container.style.cssText = `
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scroll-behavior: smooth;
    height: 100%;
  `;

  const mainSection = document.createElement('div');
  mainSection.className = 'main-video-section';
  mainSection.style.cssText = `
    display: grid;
    gap: 10px;
    padding: 10px;
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
    height: calc(100vh - 80px);
  `;

  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .main-video-section {
        grid-template-columns: 1fr !important;
        grid-template-rows: ${totalTopTiles === 2 ? '1fr 1fr' : '1fr'} !important;
        gap: 8px !important;
        padding: 8px !important;
      }
      .other-participants-scroll-section {
        grid-template-columns: 1fr !important;
        grid-auto-rows: minmax(200px, 1fr) !important;
        gap: 8px !important;
        padding: 8px !important;
      }
    }
    @media (min-width: 769px) {
      .main-video-section {
        grid-template-columns: ${totalTopTiles === 2 ? '1fr 1fr' : '1fr'} !important;
        grid-template-rows: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);

  if (trainerTile) {
    mainSection.appendChild(trainerTile);
  }
  if (localTile) {
    mainSection.appendChild(localTile);
  }

  container.appendChild(mainSection);

  if (hasOthers) {
    const scrollSection = document.createElement('div');
    scrollSection.className = 'other-participants-scroll-section';
    scrollSection.style.cssText = `
      display: grid;
      gap: 10px;
      padding: 20px 10px;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    `;

    // Calculate optimal number of columns based on screen width
    const screenWidth = window.innerWidth;
    let columns;
    if (screenWidth <= 480) {
      columns = 1;
    } else if (screenWidth <= 768) {
      columns = 2;
    } else {
      columns = Math.min(3, Math.ceil(Math.sqrt(otherTiles.length)));
    }

    scrollSection.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    scrollSection.style.gridAutoRows = `minmax(200px, 1fr)`;

    otherTiles.forEach(tile => {
      scrollSection.appendChild(tile);
    });

    container.appendChild(scrollSection);
  }
}

function setupStandardLayout(container, tiles) {
  // All tiles (including local video) are now in the container
  // No need to separately handle local video

  tiles.forEach(tile => {
    tile.style.gridArea = '';
  });

  const count = tiles.length;
  if (count === 1) {
    container.style.gridTemplateColumns = '1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 2) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 3) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
    tiles[0].style.gridArea = '1 / 1 / 3 / 2';
    tiles[1].style.gridArea = '1 / 2 / 2 / 3';
    tiles[2].style.gridArea = '2 / 2 / 3 / 3';
  } else if (count === 4) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
  } else {
    const columns = Math.ceil(Math.sqrt(count));
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${Math.ceil(count / columns)}, 1fr)`;
  }

  const controlHeight = 80;
  document.getElementById('videoMedia').style.height = `calc(100vh - ${controlHeight}px)`;
  container.style.maxHeight = `calc(100vh - ${controlHeight}px)`;
}

function setupGridLayout(container, tiles) {
  const columns = Math.ceil(Math.sqrt(tiles.length));
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${Math.ceil(tiles.length / columns)}, 1fr)`;
}

class RoomClient {
  constructor(localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback, isTrainer = '0') {
    // Track pinned videos (socketId -> boolean)
    this.pinnedVideos = new Map();
    // Track muted participants (socketId -> boolean)
    this.mutedParticipants = new Map();
    this.lastMuteNotification = new Map(); // Track last mute notification time to prevent duplicates
    this.name = name
    this.log_id = null // Store log_id from join API response
    this.localMediaEl = localMediaEl
    this.remoteVideoEl = remoteVideoEl
    this.remoteAudioEl = remoteAudioEl
    this.mediasoupClient = mediasoupClient
    this.isTrainer = isTrainer === '1' || isTrainer === true
    this.socket = socket
    this.producerTransport = null
    this.consumerTransport = null
    this.device = null
    this.room_id = room_id
    this.successCallback = successCallback
    this.consumers = new Map()
    this.producers = new Map()
    this.participants = []
    this.participantContainers = new Map() // Map socketId to container element
    this.getParticipants()
    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map()
    this.isVideoOnFullScreen = false
    this.isDevicesVisible = false
    this.routerRtpCapabilities = null
    this.recvTransport = null
    this.sendTransport = null
    this.poseDetectionActive = false
    this.poseDetection = null
    this.poseComparisonMode = 'live'
    this.latestCapturedPose = null
    this._isOpen = false
    this.eventListeners = new Map()

    Object.keys(_EVENTS).forEach(
      function (evt) {
        this.eventListeners.set(evt, [])
      }.bind(this)
    )

    // Add window resize handler
    window.addEventListener('resize', () => {
      updateLayout();
    });

    // Initialize local video position
    this.localVideoPosition = 'top-right'; // Default position

    // Add new properties for transport recovery
    this.transportRetryCount = 0
    this.maxTransportRetries = 3
    this.transportRetryDelay = 2000 // 2 seconds

    // Add properties for image capture
    this.captureCanvas = document.createElement('canvas')
    this.captureContext = this.captureCanvas.getContext('2d')
    this.capturedImages = new Map() // Store captured images with timestamps

    this.initPoseComparison()

    // Track attendance on page unload (browser close/navigation)
    this.beforeUnloadHandler = (event) => {
      if (this.room_id && this._isOpen) {
        // Get token from localStorage or URL (optional - API will be called even without token)
        const token = localStorage.getItem('access_token') || (typeof getTokenFromURL === 'function' ? getTokenFromURL() : null);
        const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
        const endpoint = `${API_BASE_URL}/attendances/session/${this.room_id}/leave`;

        // Prepare headers - include Authorization only if token is available
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Prepare FormData with name, device info, and log_id
        const formData = new FormData();
        if (this.name) {
          formData.append('name', this.name);
        }
        // Include log_id if available (from join response)
        if (this.log_id) {
          formData.append('log_id', this.log_id);
        }
        const deviceInfo = this.getDeviceInfo();
        formData.append('device_name', deviceInfo.device_name || deviceInfo.device_type);
        formData.append('timestamp', new Date().toISOString());
        formData.append('metadata', JSON.stringify(deviceInfo));

        // Use fetch with keepalive for reliable tracking on page unload
        // keepalive ensures the request continues even after page unload
        // Call API even without token
        fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: formData,
          keepalive: true
        }).catch(() => { }); // Ignore errors on unload
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    this.createRoom(room_id).then(
      async function () {
        await this.join(name, room_id, isTrainer)
        this.initSockets()
        this._isOpen = true
        // Call the callback
        if (typeof this.successCallback === 'function') {
          this.successCallback()
        }
      }.bind(this)
    )
  }

  ////////// INIT /////////

  async createRoom(room_id) {
    await this.socket
      .request('createRoom', {
        room_id
      })
      .catch((err) => {
        console.log('Create room error:', err)
      })
  }

  async join(name, room_id, isTrainer) {
    // Get profile picture from user profile if available
    let profile_pic = null;
    if (window.userProfile && window.userProfile.profile_pic) {
      profile_pic = window.userProfile.profile_pic;
    }

    // Track attendance - join session (with name and device metadata)
    // Await to store log_id from response
    this.trackAttendance(room_id, 'join', name, null).catch(err => {
      console.error('Failed to track attendance (join):', err);
    });

    socket
      .request('join', {
        name,
        room_id,
        isTrainer,
        profile_pic
      })
      .then(
        async function (e) {
          // Create a container for the local video
          const container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-local-${socket.id}`;
          container.style.position = 'relative';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.backgroundColor = '#1B4332';

          // Create the video element
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.id = socket.id;
          video.className = 'vid';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'contain';
          video.style.display = 'none'; // Initially hidden until video starts
          video.style.pointerEvents = 'none'; // Allow clicks to pass through to container

          // Create profile picture placeholder (shown when video is off)
          const profilePicPlaceholder = document.createElement('div');
          profilePicPlaceholder.className = 'profile-pic-placeholder';
          profilePicPlaceholder.id = `profile-pic-${socket.id}`;
          profilePicPlaceholder.style.width = '100%';
          profilePicPlaceholder.style.height = '100%';
          profilePicPlaceholder.style.display = 'flex';
          profilePicPlaceholder.style.alignItems = 'center';
          profilePicPlaceholder.style.justifyContent = 'center';
          profilePicPlaceholder.style.position = 'absolute';
          profilePicPlaceholder.style.top = '0';
          profilePicPlaceholder.style.left = '0';
          profilePicPlaceholder.style.right = '0';
          profilePicPlaceholder.style.bottom = '0';
          profilePicPlaceholder.style.zIndex = '1';

          // Set profile picture if available
          if (window.userProfile) {
            const profile = window.userProfile;
            if (profile.profile_pic) {
              // Get base URL - try multiple sources
              let baseURL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
              if (!baseURL && typeof window !== 'undefined' && window.location) {
                // Try to construct from current location
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                baseURL = `${protocol}//${hostname}:8000/api/v1`;
              }
              const picUrl = profile.profile_pic.startsWith('http')
                ? profile.profile_pic
                : `${baseURL.replace('/api/v1', '')}/${profile.profile_pic}`;
              profilePicPlaceholder.innerHTML = `
                <img src="${picUrl}" alt="${profile.name || 'User'}" 
                     style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid white;" />
              `;
            } else {
              // Default avatar with first letter
              const initial = (profile.name || 'U').charAt(0).toUpperCase();
              profilePicPlaceholder.innerHTML = `
                <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                            display: flex; align-items: center; justify-content: center; 
                            color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
                  ${initial}
                </div>
              `;
            }
          } else {
            // Default avatar if no profile - use name from join if available
            const userName = name || 'U';
            const initial = userName.charAt(0).toUpperCase();
            profilePicPlaceholder.innerHTML = `
              <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                          display: flex; align-items: center; justify-content: center; 
                          color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
                ${initial}
              </div>
            `;
          }

          // Create an overlay for the name and trainer tag
          const overlay = document.createElement('div');
          overlay.className = 'video-overlay';
          overlay.style.zIndex = '2';

          // Set the overlay content
          overlay.innerHTML = `
            <div class="video-info">
              <span class="video-name you-indicator">You</span>
              ${this.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
            </div>
          `;

          // Add elements to the container
          container.appendChild(profilePicPlaceholder);
          container.appendChild(video);
          container.appendChild(overlay);

          // Add the container to the remote videos container (render with remote tiles)
          document.getElementById('remoteVideos').appendChild(container);

          try {
            const data = await this.socket.request('getRouterRtpCapabilities');
            let device = await this.loadDevice(data);
            this.device = device;

            await this.initTransports(device);

            // Process any pending producers that arrived before device was ready
            if (this._pendingProducers && this._pendingProducers.length > 0) {
              const producers = [...this._pendingProducers];
              this._pendingProducers = [];

              for (let { producer_id } of producers) {
                await this.consume(producer_id);
              }
            }

            this.socket.emit('getProducers');

            // Update layout after adding local video
            updateLayout();
          } catch (err) {
            console.error('Error during join:', err);
          }
        }.bind(this)
      )
      .catch((err) => {
        console.log('Join error:', err);
      });

    // Create capture button if user is trainer
    // this.createCaptureButton()

  }

  // Inside your client code
  async getParticipants() {
    try {
      const data = await this.socket.request('getParticipants', { room_id: this.room_id });

      if (data.error) {
        console.error('Error fetching participants:', data.error);
        return;
      }

      this.participants = data.participants;
      this.isTrainer = data.isTrainer;

      // Update the UI with the new data
      this.updateParticipantsList();

      // Debug participants info
      this.debugParticipants();
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  }

  debugParticipants() {
    // Check DOM elements
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');


    console.groupEnd();
  }

  updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');

    if (!participantsList) {
      console.warn('Participants list element not found');
      return;
    }

    // Clear the current list
    participantsList.innerHTML = '';

    // Ensure participants array exists
    if (!this.participants) {
      this.participants = [];
      console.warn('Participants array was undefined, initialized to empty array');
    }

    // Update the count
    if (participantsCount) {
      const total = this.participants.length;
      const label = total === 1 ? 'user' : 'users';
      participantsCount.textContent = `${total} ${label}`;
    }

    const participantsBadge = document.getElementById('participantsBadge');
    if (participantsBadge) {
      const total = this.participants.length;
      participantsBadge.textContent = String(total);
      participantsBadge.classList.toggle('hidden', total === 0);
      participantsBadge.setAttribute('aria-hidden', total === 0 ? 'true' : 'false');
    }

    // Create/update containers for all participants (except local user)
    this.createParticipantContainers();

    // Update mute buttons for all participants when list is refreshed
    if (this.isTrainer) {
      this.participants.forEach(participant => {
        if (participant.socketId !== this.socket.id) {
          const hasAudio = this.hasProducer(participant.socketId, mediaType.audio);
          const isMuted = this.mutedParticipants.get(participant.socketId) || false;

          // Update mute buttons in video containers
          const containers = Array.from(document.querySelectorAll(`[data-socket-id="${participant.socketId}"]`));
          containers.forEach(container => {
            const muteButton = container.querySelector('.video-mute-btn');
            if (muteButton) {
              if (!hasAudio) {
                // Audio is off - show disabled state
                muteButton.classList.add('disabled');
                muteButton.disabled = true;
                muteButton.setAttribute('aria-label', 'Audio is off');
                muteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
                // Remove click handler
                muteButton.replaceWith(muteButton.cloneNode(true));
              } else {
                // Audio is on - show normal mute button
                muteButton.classList.remove('disabled');
                muteButton.disabled = false;

                // Add click handler if not already present
                if (!muteButton.onclick) {
                  muteButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.toggleMuteParticipant(participant.socketId);
                  });
                }

                this.updateMuteButton(muteButton, isMuted);
              }
            }
          });
        }
      });
    }


    // Create participant items
    this.participants.forEach(participant => {
      // Check media status for this participant
      const hasAudio = this.hasProducer(participant.socketId, mediaType.audio);
      const hasVideo = this.hasProducer(participant.socketId, mediaType.video);
      const isCurrentUser = participant.socketId === this.socket.id;
      const isMuted = this.mutedParticipants.get(participant.socketId) || false;

      const participantItem = document.createElement('div');
      participantItem.className = 'participant-item';
      participantItem.dataset.peerId = participant.socketId;

      // Determine audio icon and class based on mute state
      let audioIconClass = 'fa-microphone';
      let audioStatusClass = hasAudio ? 'active' : 'inactive';
      if (isMuted && hasAudio) {
        audioIconClass = 'fa-microphone-slash';
        audioStatusClass = 'muted-by-trainer';
      } else if (!hasAudio) {
        audioIconClass = 'fa-microphone-slash';
      }

      let participantHTML = `
        <div class="participant-info">
          <div class="participant-name">
            ${participant.name}
            ${isCurrentUser ? '<span class="you-indicator">You</span>' : ''}
            ${participant.isTrainer ? '<span class="trainer-indicator">Trainer</span>' : ''}
            ${isMuted && hasAudio ? '<span class="muted-indicator" title="Audio muted by trainer"><i class="fas fa-microphone-slash"></i></span>' : ''}
          </div>
          <div class="participant-status">
            <span class="status-icon ${audioStatusClass}" title="${isMuted && hasAudio ? 'Muted by trainer' : (hasAudio ? 'Audio on' : 'Audio off')}">
              <i class="fas ${audioIconClass}"></i>
            </span>
            <span class="status-icon ${hasVideo ? 'active' : 'inactive'}" title="${hasVideo ? 'Video on' : 'Video off'}">
              <i class="fas ${hasVideo ? 'fa-video' : 'fa-video-slash'}"></i>
            </span>
          </div>
        </div>
      `;

      // Add remove button if current user is trainer and this is not themselves
      // Trainers can remove any user (including other trainers)
      if (this.isTrainer && !isCurrentUser) {
        participantHTML += `
          <div class="participant-actions">
            <button class="action-btn remove" data-peer-id="${participant.socketId}" title="Remove ${participant.name}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }

      participantItem.innerHTML = participantHTML;
      participantsList.appendChild(participantItem);

      // Add event listener to remove button
      if (this.isTrainer && !isCurrentUser) {
        const removeBtn = participantItem.querySelector('.remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            showConfirmModal(
              'Remove Participant',
              `Are you sure you want to remove ${participant.name} from the session?`,
              () => {
                this.kickParticipant(participant.socketId);
                closeConfirmModal();
              }
            );
          });
        }
      }
    });

    // Show the participants panel button
    const participantsButton = document.getElementById('participantsButton');
    const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');

    if (participantsButton) participantsButton.classList.remove('hidden');
    if (toggleParticipantsBtn) toggleParticipantsBtn.classList.remove('hidden');
  }

  // Create containers for all participants (showing profile pic if no video)
  createParticipantContainers() {
    if (!this.participants || this.participants.length === 0) {
      return;
    }

    const remoteVideosContainer = document.getElementById('remoteVideos');
    if (!remoteVideosContainer) {
      return;
    }

    // Create containers for all remote participants (not local user)
    this.participants.forEach(participant => {
      // Skip local user - they have their own container
      if (participant.socketId === this.socket.id) {
        return;
      }

      // Check if container already exists
      let container = this.participantContainers.get(participant.socketId);

      if (!container) {
        // Create new container
        container = document.createElement('div');
        container.className = 'video-container';
        container.id = `container-participant-${participant.socketId}`;
        container.dataset.socketId = participant.socketId;
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.backgroundColor = '#1B4332';

        // Create profile picture placeholder
        const profilePicPlaceholder = document.createElement('div');
        profilePicPlaceholder.className = 'profile-pic-placeholder';
        profilePicPlaceholder.id = `profile-pic-participant-${participant.socketId}`;
        profilePicPlaceholder.style.width = '100%';
        profilePicPlaceholder.style.height = '100%';
        profilePicPlaceholder.style.display = 'flex';
        profilePicPlaceholder.style.alignItems = 'center';
        profilePicPlaceholder.style.justifyContent = 'center';
        profilePicPlaceholder.style.position = 'absolute';
        profilePicPlaceholder.style.top = '0';
        profilePicPlaceholder.style.left = '0';
        profilePicPlaceholder.style.right = '0';
        profilePicPlaceholder.style.bottom = '0';
        profilePicPlaceholder.style.zIndex = '1';

        // Set profile picture
        this.setProfilePicture(profilePicPlaceholder, participant.profile_pic, participant.name);

        // Create overlay for name and trainer tag
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.style.zIndex = '2';
        const isPinned = this.pinnedVideos.get(participant.socketId) || false;

        // Create video info div
        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'video-name';
        nameSpan.textContent = participant.name;
        videoInfo.appendChild(nameSpan);

        // Add mute indicator if participant is muted
        const isMuted = this.mutedParticipants.get(participant.socketId) || false;
        if (isMuted) {
          const muteIndicator = document.createElement('span');
          muteIndicator.className = 'video-mute-indicator';
          muteIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
          muteIndicator.setAttribute('title', 'Audio muted by trainer');
          videoInfo.appendChild(muteIndicator);
        }

        if (participant.isTrainer) {
          const trainerBadge = document.createElement('span');
          trainerBadge.className = 'video-trainer-badge';
          trainerBadge.textContent = 'Trainer';
          videoInfo.appendChild(trainerBadge);
        }

        // Create pin button
        const pinButton = document.createElement('button');
        pinButton.className = 'video-pin-btn';
        pinButton.type = 'button';
        pinButton.setAttribute('aria-label', isPinned ? 'Unpin video' : 'Pin video');
        pinButton.innerHTML = isPinned
          ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z" opacity="0.6"/></svg>';

        // Add click handler to pin button
        pinButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.togglePinVideo(participant.socketId);
        });

        overlay.appendChild(videoInfo);
        overlay.appendChild(pinButton);

        // Add mute button (only for trainers, and not for local user)
        if (this.isTrainer && participant.socketId !== this.socket.id) {
          const hasAudio = this.hasProducer(participant.socketId, mediaType.audio);
          const isMuted = this.mutedParticipants.get(participant.socketId) || false;

          const muteButton = document.createElement('button');
          muteButton.className = 'video-mute-btn';
          muteButton.type = 'button';

          if (!hasAudio) {
            // Audio is off - show disabled state
            muteButton.classList.add('disabled');
            muteButton.disabled = true;
            muteButton.setAttribute('aria-label', 'Audio is off');
            muteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
          } else {
            // Audio is on - show normal mute button
            muteButton.setAttribute('aria-label', 'Mute audio');
            this.updateMuteButton(muteButton, isMuted);

            // Add click handler to mute button
            muteButton.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await this.toggleMuteParticipant(participant.socketId);
            });
          }

          overlay.appendChild(muteButton);
        }

        // Update container pinned state
        if (isPinned) {
          container.classList.add('pinned');
        } else {
          container.classList.remove('pinned');
        }

        container.appendChild(profilePicPlaceholder);
        container.appendChild(overlay);

        // Add to DOM
        remoteVideosContainer.appendChild(container);

        // Store reference
        this.participantContainers.set(participant.socketId, container);
      } else {
        // Update existing container's profile pic and info if needed
        const profilePicPlaceholder = container.querySelector('.profile-pic-placeholder');
        if (profilePicPlaceholder) {
          this.setProfilePicture(profilePicPlaceholder, participant.profile_pic, participant.name);
        }

        // Update overlay
        const overlay = container.querySelector('.video-overlay');
        if (overlay) {
          // Get or create video info
          let videoInfo = overlay.querySelector('.video-info');
          if (!videoInfo) {
            videoInfo = document.createElement('div');
            videoInfo.className = 'video-info';
            overlay.insertBefore(videoInfo, overlay.firstChild);
          }

          // Update video info content
          const isMuted = this.mutedParticipants.get(participant.socketId) || false;
          const muteIndicatorHTML = isMuted
            ? '<span class="video-mute-indicator" title="Audio muted by trainer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg></span>'
            : '';
          videoInfo.innerHTML = `
            <span class="video-name">${participant.name}</span>
            ${muteIndicatorHTML}
            ${participant.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
          `;

          // Ensure pin button exists
          let pinButton = overlay.querySelector('.video-pin-btn');
          if (!pinButton) {
            pinButton = document.createElement('button');
            pinButton.className = 'video-pin-btn';
            pinButton.type = 'button';
            overlay.appendChild(pinButton);

            // Add click handler to pin button
            pinButton.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.togglePinVideo(participant.socketId);
            });
          }

          // Update pin button icon based on pinned state
          const isPinned = this.pinnedVideos.get(participant.socketId) || false;
          pinButton.setAttribute('aria-label', isPinned ? 'Unpin video' : 'Pin video');
          pinButton.innerHTML = isPinned
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z" opacity="0.6"/></svg>';

          // Update mute button if exists (only for trainers)
          if (this.isTrainer && participant.socketId !== this.socket.id) {
            const hasAudio = this.hasProducer(participant.socketId, mediaType.audio);
            const isMuted = this.mutedParticipants.get(participant.socketId) || false;

            let muteButton = overlay.querySelector('.video-mute-btn');
            if (!muteButton) {
              muteButton = document.createElement('button');
              muteButton.className = 'video-mute-btn';
              muteButton.type = 'button';
              overlay.appendChild(muteButton);
            }

            // Update button based on audio state
            if (!hasAudio) {
              // Audio is off - show disabled state
              muteButton.classList.add('disabled');
              muteButton.disabled = true;
              muteButton.setAttribute('aria-label', 'Audio is off');
              muteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
              // Remove click handler
              muteButton.replaceWith(muteButton.cloneNode(true));
            } else {
              // Audio is on - show normal mute button
              muteButton.classList.remove('disabled');
              muteButton.disabled = false;

              // Add click handler if not already present
              if (!muteButton.onclick) {
                muteButton.addEventListener('click', async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await this.toggleMuteParticipant(participant.socketId);
                });
              }

              this.updateMuteButton(muteButton, isMuted);
            }
          }
        }
      }
    });

    // Remove containers for participants who left
    const currentSocketIds = new Set(this.participants.map(p => p.socketId));
    const localSocketId = this.socket.id;

    this.participantContainers.forEach((container, socketId) => {
      if (socketId !== localSocketId && !currentSocketIds.has(socketId)) {
        // Participant left, but keep container if they have active video consumers
        // Only remove if no video consumers exist
        const hasVideoConsumer = Array.from(this.consumers.values()).some(consumer => {
          return consumer.appData && consumer.appData.producerSocketId === socketId;
        });

        if (!hasVideoConsumer) {
          container.remove();
          this.participantContainers.delete(socketId);
        }
      }
    });

    updateLayout();
  }

  // Helper function to detect device type and collect metadata
  getDeviceInfo() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = window.screen ? window.screen.width : null;
    const screenHeight = window.screen ? window.screen.height : null;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    // Detect device type
    let deviceType = 'desktop';
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent) ||
      (screenWidth && screenWidth >= 768 && screenWidth < 1024 && isMobile);

    if (isTablet) {
      deviceType = 'tablet';
    } else if (isMobile) {
      deviceType = 'mobile';
    } else if (screenWidth && screenWidth < 768) {
      deviceType = 'mobile';
    } else if (screenWidth && screenWidth >= 768 && screenWidth < 1024) {
      deviceType = 'tablet';
    } else {
      deviceType = 'laptop';
      // Check if it's a desktop (larger screen, typically external monitor)
      if (screenWidth && screenWidth >= 1920) {
        deviceType = 'desktop';
      }
    }

    // Detect browser
    let browser = 'unknown';
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      browser = 'chrome';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'firefox';
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'safari';
    } else if (userAgent.indexOf('Edg') > -1) {
      browser = 'edge';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'opera';
    }

    // Detect OS
    let os = 'unknown';
    if (userAgent.indexOf('Windows') > -1) {
      os = 'windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'macos';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'android';
    } else if (userAgent.indexOf('iOS') > -1 || /iPad|iPhone|iPod/.test(userAgent)) {
      os = 'ios';
    }

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get language
    const language = navigator.language || navigator.userLanguage;

    // Check if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      device_type: deviceType,
      device_name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}`,
      browser: browser,
      browser_version: this.getBrowserVersion(userAgent, browser),
      os: os,
      os_version: this.getOSVersion(userAgent, os),
      screen_width: screenWidth,
      screen_height: screenHeight,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      user_agent: userAgent,
      timezone: timezone,
      language: language,
      is_touch_device: isTouchDevice,
      platform: navigator.platform || 'unknown',
      cookie_enabled: navigator.cookieEnabled,
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  // Helper to extract browser version
  getBrowserVersion(userAgent, browser) {
    const versionMatch = userAgent.match(new RegExp(`${browser}[\\s/]+([\\d.]+)`, 'i'));
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  // Helper to extract OS version
  getOSVersion(userAgent, os) {
    if (os === 'windows') {
      const match = userAgent.match(/Windows NT ([0-9.]+)/);
      return match ? match[1] : 'unknown';
    } else if (os === 'macos') {
      const match = userAgent.match(/Mac OS X ([0-9_]+)/);
      return match ? match[1].replace(/_/g, '.') : 'unknown';
    } else if (os === 'android') {
      const match = userAgent.match(/Android ([0-9.]+)/);
      return match ? match[1] : 'unknown';
    } else if (os === 'ios') {
      const match = userAgent.match(/OS ([0-9_]+)/);
      return match ? match[1].replace(/_/g, '.') : 'unknown';
    }
    return 'unknown';
  }

  // Track attendance API call
  async trackAttendance(session_id, action, name = null, metadata = null) {
    try {
      // Get token from localStorage or URL (optional - API will be called even without token)
      const token = localStorage.getItem('access_token') || (typeof getTokenFromURL === 'function' ? getTokenFromURL() : null);

      // Get API base URL
      const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';

      // Determine endpoint based on action
      const endpoint = action === 'join'
        ? `${API_BASE_URL}/attendances/session/${session_id}/join`
        : `${API_BASE_URL}/attendances/session/${session_id}/leave`;

      // Prepare headers - include Authorization only if token is available
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare request body - send data as FormData for both join and leave actions
      let requestBody = null;
      const formData = new FormData();

      if (action === 'join') {
        if (name) {
          formData.append('name', name);
        }
        // Use provided metadata or get device info
        const deviceInfo = metadata || this.getDeviceInfo();
        formData.append('device_name', deviceInfo.device_name || deviceInfo.device_type);

        // Append metadata as JSON string (backend can parse it)
        formData.append('metadata', JSON.stringify(deviceInfo));
      } else if (action === 'leave') {
        // For leave action, send name, device info, timestamp, and log_id
        if (name) {
          formData.append('name', name);
        }
        // Include log_id if available (from join response)
        if (this.log_id) {
          formData.append('log_id', this.log_id);
        }
        const deviceInfo = metadata || this.getDeviceInfo();
        formData.append('device_name', deviceInfo.device_name || deviceInfo.device_type);
        formData.append('timestamp', new Date().toISOString());

        // Append metadata as JSON string (backend can parse it)
        formData.append('metadata', JSON.stringify(deviceInfo));
      }

      requestBody = formData;
      // Don't set Content-Type header for FormData - browser will set it with boundary automatically

      // Make API call (even without token)
      const fetchOptions = {
        method: 'POST',
        headers: headers
      };
      if (requestBody) {
        fetchOptions.body = requestBody;
      }

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Attendance tracking failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json().catch(() => ({}));
      console.log(`Attendance tracked successfully (${action}):`, data);

      // Store log_id from join API response
      if (action === 'join' && data) {
        const logId = data?.data?.log_id || data?.log_id || data?.data?.id || data?.id;
        if (logId) {
          this.log_id = logId;
          console.log('Stored log_id from join response:', logId);
        }
      }

      return data;
    } catch (error) {
      console.error(`Error tracking attendance (${action}):`, error);
      throw error;
    }
  }

  // Helper method to set profile picture in a placeholder element
  setProfilePicture(placeholder, profilePic, name) {
    if (profilePic) {
      // Get base URL - try multiple sources
      let baseURL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
      if (!baseURL && typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        baseURL = `${protocol}//${hostname}:8000/api/v1`;
      }
      const picUrl = profilePic.startsWith('http')
        ? profilePic
        : `${baseURL.replace('/api/v1', '')}/${profilePic}`;
      placeholder.innerHTML = `
        <img src="${picUrl}" alt="${name || 'User'}" 
             style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid white;" />
      `;
    } else {
      // Default avatar with first letter
      const initial = (name || 'U').charAt(0).toUpperCase();
      placeholder.innerHTML = `
        <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                    display: flex; align-items: center; justify-content: center; 
                    color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
          ${initial}
        </div>
      `;
    }
  }

  hasProducer(socketId, type) {

    // For local user
    if (socketId === socket.id) {
      const hasProducer = this.producerLabel.has(type);
      return hasProducer;
    }

    // For remote users
    for (const [consumerId, consumer] of this.consumers.entries()) {
      // Log the consumer data for debugging

      // Check if this consumer belongs to the specified socket and is of the right type
      if (consumer.appData &&
        consumer.appData.producerSocketId === socketId) {

        // For audio
        if (type === mediaType.audio && consumer.kind === 'audio') {
          return true;
        }

        // For video
        if ((type === mediaType.video || type === mediaType.screen) &&
          consumer.kind === 'video') {
          return true;
        }
      }
    }

    return false;
  }

  async loadDevice(routerRtpCapabilities) {
    let device;
    try {
      device = new this.mediasoupClient.Device();
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported');
        alert('Browser not supported');
      }
      console.error(error);
      throw error;
    }

    try {
      // Validate router RTP capabilities before loading
      if (!routerRtpCapabilities || !routerRtpCapabilities.codecs || !Array.isArray(routerRtpCapabilities.codecs)) {
        console.error('Invalid router RTP capabilities:', routerRtpCapabilities);
        throw new Error('Invalid router RTP capabilities received from server');
      }

      await device.load({
        routerRtpCapabilities
      });

      // Verify device loaded successfully
      if (!device.rtpCapabilities || !device.rtpCapabilities.codecs || device.rtpCapabilities.codecs.length === 0) {
        console.error('Device loaded but RTP capabilities are invalid');
        throw new Error('Device RTP capabilities are invalid after loading');
      }

      console.log('Device loaded successfully with', device.rtpCapabilities.codecs.length, 'codecs');
      return device;
    } catch (error) {
      console.error('Failed to load device:', error);
      console.error('Router RTP capabilities:', routerRtpCapabilities);
      throw error;
    }
  }

  async initTransports(device) {
    // init producerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities
      })

      if (data.error) {
        console.error(data.error)
        return
      }

      this.producerTransport = device.createSendTransport(data)

      this.producerTransport.on(
        'connect',
        async function ({ dtlsParameters }, callback, errback) {
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
        }.bind(this)
      )

      this.producerTransport.on(
        'produce',
        async function ({ kind, rtpParameters }, callback, errback) {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            })
            callback({
              id: producer_id
            })
          } catch (err) {
            errback(err)
          }
        }.bind(this)
      )

      this.producerTransport.on(
        'connectionstatechange',
        async function (state) {
          switch (state) {
            case 'connecting':
              break;
            case 'connected':
              this.transportRetryCount = 0; // Reset retry count on successful connection
              break;
            case 'failed':
              await this.handleTransportFailure();
              break;
            case 'disconnected':
              await this.handleTransportFailure();
              break;
            case 'closed':
              await this.handleTransportFailure();
              break;
            default:
              break;
          }
        }.bind(this)
      )
    }

    // init consumerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false
      })

      if (data.error) {
        console.error(data.error)
        return
      }

      // only one needed
      this.consumerTransport = device.createRecvTransport(data)
      this.consumerTransport._isConnected = false; // Track connection state

      this.consumerTransport.on(
        'connect',
        function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request('connectTransport', {
              transport_id: this.consumerTransport.id,
              dtlsParameters
            })
            .then(() => {
              this.consumerTransport._isConnected = true;
              callback();
            })
            .catch((err) => {
              this.consumerTransport._isConnected = false;
              errback(err);
            })
        }.bind(this)
      )

      this.consumerTransport.on(
        'connectionstatechange',
        async function (state) {
          switch (state) {
            case 'connecting':
              break

            case 'connected':
              //remoteVideo.srcObject = await stream;
              //await socket.request('resume');
              break

            case 'failed':
              this.consumerTransport.close()
              break

            default:
              break
          }
        }.bind(this)
      )
    }
  }

  initSockets() {
    this.socket.on(
      'consumerClosed',
      function ({ consumer_id }) {
        this.removeConsumer(consumer_id)
      }.bind(this)
    )

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on(
      'newProducers',
      async function (data) {

        // Make sure device is initialized before consuming
        if (!this.device || !this.device.rtpCapabilities) {
          console.warn('Device not initialized yet, cannot consume new producers');
          // Store producers to consume later
          this._pendingProducers = this._pendingProducers || [];
          this._pendingProducers.push(...data);
          return;
        }

        for (let { producer_id } of data) {
          await this.consume(producer_id);
        }

        // Refresh participants list when new producers are added
        this.getParticipants();
      }.bind(this)
    )

    // Add event listener for when participants join/leave
    this.socket.on(
      'peerClosed',
      function (data) {

        // Store the name of the participant who left before updating the list
        let leftParticipantName = 'Unknown';
        if (this.participants) {
          const leftParticipant = this.participants.find(p => p.socketId === data.peerId);
          if (leftParticipant && leftParticipant.name) {
            leftParticipantName = leftParticipant.name;
          } else if (data.name) {
            leftParticipantName = data.name;
          }
        }

        // Show notification if function exists (defined in index.js)
        if (typeof showLeaveNotification === 'function' && data.name && data.peerId !== this.socket.id) {
          showLeaveNotification(data.name);
        }

        // Remove container for the participant who left
        const container = this.participantContainers.get(data.peerId);
        if (container) {
          container.remove();
          this.participantContainers.delete(data.peerId);
        }

        // Remove the participant from our local list immediately
        if (this.participants) {
          this.participants = this.participants.filter(p => p.socketId !== data.peerId);

          // Update the UI with our local data first for immediate feedback
          this.updateParticipantsList();
        }

        // Then fetch the latest participants list from the server to ensure consistency
        this.getParticipants();

      }.bind(this)
    )

    this.socket.on(
      'disconnect',
      function () {
        this.exit(true)
      }.bind(this)
    )

    // Add event listener for when a new peer joins
    this.socket.on(
      'newPeer',
      function (data) {
        // Show notification if function exists (defined in index.js)
        if (typeof showJoinNotification === 'function' && data.name && data.peerId !== this.socket.id) {
          showJoinNotification(data.name, data.isTrainer || false);
        }
        // Refresh the participants list
        this.getParticipants()
      }.bind(this)
    )

    // Add event listener for producer state changes
    // this.socket.on(
    //   'producerStateChanged',
    //   function (data) {
    //     if (data.state == 'closed') {
    //       document.getElementById('poseDetectionButton').classList.add('hidden')
    //     }
    //     else {
    //       document.getElementById('poseDetectionButton').classList.remove('hidden')
    //     }
    //     // Refresh the participants list
    //     this.getParticipants()
    //   }.bind(this)
    // )

    // Add event listener for being kicked from the room
    this.socket.on(
      'kickedFromRoom',
      function () {
        alert('You have been removed from the room by the admin.')
        this.exit(true) // Force exit to return to home screen
      }.bind(this)
    )

    // Add listener for receiving captured images
    this.socket.on('displayCapturedImage', ({ imageData, timestamp, capturedBy }) => {
      this.displayCapturedImage(imageData, timestamp, capturedBy);
    });

    // Add listener for loading captured images when joining a room
    this.socket.on('loadCapturedImages', (images) => {
      images.forEach(({ imageData, timestamp, capturedBy }) => {
        this.displayCapturedImage(imageData, timestamp, capturedBy);
      });
    });

    // Listen for participant audio mute/unmute events
    this.socket.on('participantAudioMuted', (data) => {
      // Prevent duplicate notifications - check if we already processed this mute
      const notificationKey = `mute-${data.peerId}`;
      const lastNotification = this.lastMuteNotification.get(notificationKey);
      const now = Date.now();

      // Only process if this is a new mute event (not within 2 seconds of last notification)
      if (lastNotification && (now - lastNotification) < 2000) {
        return; // Skip duplicate notification
      }

      this.lastMuteNotification.set(notificationKey, now);

      // Skip if already muted (prevent duplicate state updates)
      if (this.mutedParticipants.get(data.peerId) === true) {
        return;
      }

      this.mutedParticipants.set(data.peerId, true);
      this.updateMuteButtonsForParticipant(data.peerId, true);

      // If this is the local user being muted, update UI
      if (data.peerId === this.socket.id) {
        this.updateLocalAudioMutedState(true);
        if (typeof showWarningNotification === 'function') {
          showWarningNotification('Your microphone has been muted by the trainer', 'Microphone Muted');
        }
      } else {
        // Update visual indicator for remote participant
        this.updateParticipantMuteIndicator(data.peerId, true);
      }

      // Update participants list to reflect mute state
      this.updateParticipantsList();
    });

    this.socket.on('participantAudioUnmuted', (data) => {
      // Prevent duplicate notifications - check if we already processed this unmute
      const notificationKey = `unmute-${data.peerId}`;
      const lastNotification = this.lastMuteNotification.get(notificationKey);
      const now = Date.now();

      // Only process if this is a new unmute event (not within 2 seconds of last notification)
      if (lastNotification && (now - lastNotification) < 2000) {
        return; // Skip duplicate notification
      }

      this.lastMuteNotification.set(notificationKey, now);

      // Skip if already unmuted (prevent duplicate state updates)
      if (this.mutedParticipants.get(data.peerId) === false) {
        return;
      }

      this.mutedParticipants.set(data.peerId, false);
      this.updateMuteButtonsForParticipant(data.peerId, false);

      // If this is the local user being unmuted, update UI
      if (data.peerId === this.socket.id) {
        this.updateLocalAudioMutedState(false);
        if (typeof showSuccessNotification === 'function') {
          showSuccessNotification('Your microphone has been unmuted by the trainer', 'Microphone Unmuted');
        }
      } else {
        // Update visual indicator for remote participant
        this.updateParticipantMuteIndicator(data.peerId, false);
      }

      // Update participants list to reflect unmute state
      this.updateParticipantsList();
    });
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null, codec = 'vp8') {
    try {
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')

      let mediaConstraints = {}
      let audio = false
      let screen = false
      switch (type) {
        case mediaType.audio:
          mediaConstraints = {
            audio: {
              deviceId: deviceId
            },
            video: false
          }
          audio = true
          break
        case mediaType.video: {
          let validDeviceId = deviceId
          if (
            validDeviceId &&
            typeof navigator !== 'undefined' &&
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.enumerateDevices === 'function'
          ) {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices()
              const videoDevices = devices.filter((d) => d.kind === 'videoinput')
              if (!videoDevices.some((d) => d.deviceId === validDeviceId)) {
                console.warn('Selected camera not found. Falling back to default camera.')
                validDeviceId = null
              }
            } catch (err) {
              console.warn('Unable to verify camera device. Using default camera.', err)
              validDeviceId = null
            }
          }

          const videoConstraints = isMobileDevice
            ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }
            : {
              width: {
                min: 320,
                ideal: 1280,
                max: 1920
              },
              height: {
                min: 240,
                ideal: 720,
                max: 1080
              }
            }

          if (validDeviceId) {
            videoConstraints.deviceId = { exact: validDeviceId }
          }

          mediaConstraints = {
            audio: false,
            video: videoConstraints
          }
          break
        }
        case mediaType.screen:
          mediaConstraints = false
          screen = true
          break
        default:
          return
      }
      if (!this.device.canProduce('video') && !audio) {
        console.error('Cannot produce video')
        return
      }
      if (this.producerLabel.has(type)) {
        return
      }
      let stream
      try {
        stream = screen
          ? await navigator.mediaDevices.getDisplayMedia()
          : await navigator.mediaDevices.getUserMedia(mediaConstraints)
        navigator.mediaDevices.getSupportedConstraints()

        const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
        const params = { track }
        if (!audio && !screen) {
          if (isMobileDevice) {
            params.encodings = [
              {
                maxBitrate: 500000
              }
            ]
          } else {
            params.encodings = [
              {
                rid: 'r0',
                maxBitrate: 100000,
                scalabilityMode: 'S1T3'
              },
              {
                rid: 'r1',
                maxBitrate: 300000,
                scalabilityMode: 'S1T3'
              },
              {
                rid: 'r2',
                maxBitrate: 900000,
                scalabilityMode: 'S1T3'
              }
            ]
          }
          params.codecOptions = {
            videoGoogleStartBitrate: 1000
          }
        }
        const producer = await this.producerTransport.produce({
          track,
          encodings: params.encodings,
          codecOptions: params.codecOptions,
          codec: params.codec,
          appData: {
            socketId: socket.id,
            mediaType: type
          }
        })


        this.producers.set(producer.id, producer)

        if (!audio) {
          const container = document.getElementById(`container-local-${socket.id}`);
          if (container) {
            const video = container.querySelector('video');
            const profilePic = container.querySelector('.profile-pic-placeholder');
            if (video) {
              video.srcObject = stream;
              video.play().catch(e => console.error('Error playing video:', e));
              // Show video and hide profile pic when video starts
              video.style.display = 'block';
              if (profilePic) {
                profilePic.style.display = 'none';
              }
            }
          }
        }

        producer.on('trackended', () => {
          this.closeProducer(type)
        })

        producer.on('transportclose', () => {
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
            // Show profile pic when video track ends
            const container = document.getElementById(`container-local-${socket.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
          }
          this.producers.delete(producer.id)
          this.updateCaptureButtonVisibility()
        })

        producer.on('close', () => {
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
            // Show profile pic when video producer closes
            const container = document.getElementById(`container-local-${socket.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
          }
          this.producers.delete(producer.id)
          this.updateCaptureButtonVisibility()
        })

        this.producerLabel.set(type, producer.id)
        this.updateCaptureButtonVisibility()

        switch (type) {
          case mediaType.audio:
            this.event(_EVENTS.startAudio)
            break
          case mediaType.video:
            this.event(_EVENTS.startVideo)
            break
          case mediaType.screen:
            this.event(_EVENTS.startScreen)
            break
          default:
            return
        }

        this.getParticipants()
      } catch (err) {
        console.error('Error while producing media:', err)
        throw err
      }
    } catch (err) {
      // Attempt to recover if it's a transport-related error
      if (err.message && err.message.includes('transport')) {
        await this.handleTransportFailure();
      } else {
        throw err
      }
    }
  }

  async consume(producer_id) {
    try {
      // Check if device is initialized
      if (!this.device || !this.device.rtpCapabilities) {
        console.error('Device not initialized yet, cannot consume');
        return;
      }

      // Ensure consumer transport is ready
      if (!this.consumerTransport) {
        console.error('Consumer transport not initialized, cannot consume');
        return;
      }

      const consumeResult = await this.getConsumeStream(producer_id);
      if (!consumeResult) {
        console.error('Failed to get consume stream for producer:', producer_id);
        return;
      }

      const { consumer, stream, kind, appData } = consumeResult;

      // Store the consumer with its metadata
      this.consumers.set(consumer.id, consumer);

      let elem;
      if (kind === 'video') {
        // Find the participant info based on the producer socket ID
        const participant = this.participants.find(p => p.socketId === appData.producerSocketId);
        const participantName = participant ? participant.name : 'Unknown';
        const isTrainer = participant ? participant.isTrainer : false;
        const participantProfilePic = participant ? participant.profile_pic : null;

        // Check if container already exists for this participant
        let container = this.participantContainers.get(appData.producerSocketId);

        if (!container) {
          // Create a new container for the video and its overlay
          container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-${consumer.id}`;
          container.dataset.socketId = appData.producerSocketId;
          container.style.position = 'relative';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.backgroundColor = '#1B4332';

          // Store reference
          this.participantContainers.set(appData.producerSocketId, container);
        } else {
          // Update container ID to include consumer ID for tracking
          container.id = `container-${consumer.id}`;
        }

        // Create the video element
        elem = document.createElement('video');
        elem.srcObject = stream;
        elem.id = consumer.id;
        elem.playsinline = true;
        elem.autoplay = true;
        elem.className = 'vid';
        elem.style.width = '100%';
        elem.style.height = '100%';
        elem.style.objectFit = 'contain';
        elem.style.display = 'block'; // Show video initially
        elem.style.pointerEvents = 'none'; // Allow clicks to pass through to container

        // Get or create profile picture placeholder
        let profilePicPlaceholder = container.querySelector('.profile-pic-placeholder');
        if (!profilePicPlaceholder) {
          profilePicPlaceholder = document.createElement('div');
          profilePicPlaceholder.className = 'profile-pic-placeholder';
          profilePicPlaceholder.style.width = '100%';
          profilePicPlaceholder.style.height = '100%';
          profilePicPlaceholder.style.alignItems = 'center';
          profilePicPlaceholder.style.justifyContent = 'center';
          profilePicPlaceholder.style.position = 'absolute';
          profilePicPlaceholder.style.top = '0';
          profilePicPlaceholder.style.left = '0';
          profilePicPlaceholder.style.right = '0';
          profilePicPlaceholder.style.bottom = '0';
          profilePicPlaceholder.style.zIndex = '1';
          container.appendChild(profilePicPlaceholder);
        }
        profilePicPlaceholder.id = `profile-pic-${consumer.id}`;
        profilePicPlaceholder.style.display = 'none'; // Hidden initially when video is on

        // Set profile picture
        this.setProfilePicture(profilePicPlaceholder, participantProfilePic, participantName);

        // Get or create overlay for the name and trainer tag
        let overlay = container.querySelector('.video-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'video-overlay';
          overlay.style.zIndex = '2';
          container.appendChild(overlay);
        }

        // Set the overlay content
        const isPinned = this.pinnedVideos.get(appData.producerSocketId) || false;

        // Get or create video info
        let videoInfo = overlay.querySelector('.video-info');
        if (!videoInfo) {
          videoInfo = document.createElement('div');
          videoInfo.className = 'video-info';
          overlay.insertBefore(videoInfo, overlay.firstChild);
        }

        // Update video info content
        const isMuted = this.mutedParticipants.get(appData.producerSocketId) || false;
        const muteIndicatorHTML = isMuted
          ? '<span class="video-mute-indicator" title="Audio muted by trainer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg></span>'
          : '';
        videoInfo.innerHTML = `
          <span class="video-name">${participantName}</span>
          ${muteIndicatorHTML}
          ${isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
        `;

        // Create or update pin button
        let pinButton = overlay.querySelector('.video-pin-btn');
        if (!pinButton) {
          pinButton = document.createElement('button');
          pinButton.className = 'video-pin-btn';
          pinButton.type = 'button';
          overlay.appendChild(pinButton);

          // Add click handler to pin button
          pinButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePinVideo(appData.producerSocketId);
          });
        }

        // Update pin button icon based on pinned state
        pinButton.setAttribute('aria-label', isPinned ? 'Unpin video' : 'Pin video');
        pinButton.innerHTML = isPinned
          ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z" opacity="0.6"/></svg>';

        // Add mute button (only for trainers, and not for local user)
        if (this.isTrainer && appData.producerSocketId !== this.socket.id) {
          const hasAudio = this.hasProducer(appData.producerSocketId, mediaType.audio);
          const isMuted = this.mutedParticipants.get(appData.producerSocketId) || false;

          let muteButton = overlay.querySelector('.video-mute-btn');
          if (!muteButton) {
            muteButton = document.createElement('button');
            muteButton.className = 'video-mute-btn';
            muteButton.type = 'button';
            overlay.appendChild(muteButton);
          }

          // Update button based on audio state
          if (!hasAudio) {
            // Audio is off - show disabled state
            muteButton.classList.add('disabled');
            muteButton.disabled = true;
            muteButton.setAttribute('aria-label', 'Audio is off');
            muteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
            // Remove click handler
            muteButton.replaceWith(muteButton.cloneNode(true));
          } else {
            // Audio is on - show normal mute button
            muteButton.classList.remove('disabled');
            muteButton.disabled = false;

            // Add click handler if not already present
            if (!muteButton.onclick) {
              muteButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.toggleMuteParticipant(appData.producerSocketId);
              });
            }

            this.updateMuteButton(muteButton, isMuted);
          }
        }

        // Update container pinned state
        if (isPinned) {
          container.classList.add('pinned');
        } else {
          container.classList.remove('pinned');
        }

        // Check if video element already exists in container
        let existingVideo = container.querySelector('video');
        if (existingVideo) {
          // Update existing video element
          existingVideo.id = consumer.id;
          existingVideo.srcObject = stream;
          existingVideo.style.pointerEvents = 'none'; // Allow clicks to pass through
          elem = existingVideo;
        } else {
          // Add video element to container
          container.appendChild(elem);
        }

        // Ensure container is in the DOM
        const remoteVideosContainer = document.getElementById('remoteVideos');
        if (container.parentElement !== remoteVideosContainer) {
          remoteVideosContainer.appendChild(container);
        }

        // Check if video track is actually active, if not show profile pic
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live' && !videoTrack.muted && videoTrack.enabled) {
          elem.style.display = 'block';
          profilePicPlaceholder.style.display = 'none';
        } else {
          elem.style.display = 'none';
          profilePicPlaceholder.style.display = 'flex';
        }

        // Listen for track ended event to show profile pic
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          // Listen for track mute/unmute to toggle between video and profile pic
          videoTrack.addEventListener('mute', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          videoTrack.addEventListener('unmute', () => {
            if (videoTrack.readyState === 'live' && videoTrack.enabled) {
              elem.style.display = 'block';
              profilePicPlaceholder.style.display = 'none';
            }
          });

          // Listen for track enabled/disabled
          videoTrack.addEventListener('disabled', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          videoTrack.addEventListener('enabled', () => {
            if (videoTrack.readyState === 'live' && !videoTrack.muted) {
              elem.style.display = 'block';
              profilePicPlaceholder.style.display = 'none';
            }
          });
        }

        updateLayout(); // Update layout after adding video
        this.handleFS(elem.id);
      } else {
        elem = document.createElement('audio');
        elem.srcObject = stream;
        elem.id = consumer.id;
        elem.playsinline = false;
        elem.autoplay = true;
        this.remoteAudioEl.appendChild(elem);
      }

      consumer.on(
        'trackended',
        function () {
          // Show profile pic when video track ends
          if (kind === 'video') {
            const container = document.getElementById(`container-${consumer.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
          }
          this.removeConsumer(consumer.id);
        }.bind(this)
      );

      consumer.on(
        'transportclose',
        function () {
          this.removeConsumer(consumer.id);
        }.bind(this)
      );

      // Update participants list to reflect new video
      this.updateParticipantsList();

      return {
        consumer,
        params: {
          producerId: producer_id,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          type: consumer.type,
          producerPaused: consumer.producerPaused,
          producerSocketId: appData.producerSocketId,
          mediaType: appData.mediaType
        }
      };
    } catch (error) {
      console.error('Error in consume:', error);
      return null;
    }
  }

  async getConsumeStream(producerId) {
    if (!this.device || !this.device.rtpCapabilities) {
      console.error('Device not initialized yet');
      return null;
    }

    // Ensure consumer transport is initialized
    if (!this.consumerTransport) {
      console.error('Consumer transport not initialized yet');
      return null;
    }

    // Check if transport is closed
    try {
      const transportState = this.consumerTransport.connectionState;
      if (transportState === 'closed' || transportState === 'failed') {
        console.error('Consumer transport is in invalid state:', transportState);
        return null;
      }
    } catch (e) {
      // connectionState might not be available, continue anyway
      console.warn('Could not check transport state:', e);
    }

    const { rtpCapabilities } = this.device;

    try {
      const data = await this.socket.request('consume', {
        rtpCapabilities,
        consumerTransportId: this.consumerTransport.id,
        producerId
      });

      if (!data || data.error) {
        console.error('Error from consume request:', data?.error || 'Unknown error');
        return null;
      }

      const { id, kind, rtpParameters, producerSocketId } = data;

      // Validate RTP parameters
      if (!rtpParameters || !kind) {
        console.error('Invalid consume response: missing rtpParameters or kind');
        return null;
      }

      // Validate RTP parameters structure
      if (!rtpParameters.codecs || !Array.isArray(rtpParameters.codecs) || rtpParameters.codecs.length === 0) {
        console.error('Invalid RTP parameters: missing or empty codecs array');
        return null;
      }

      // Log codec information for debugging
      console.log(`Attempting to consume ${kind} with codecs:`,
        rtpParameters.codecs.map(c => `${c.mimeType}/${c.clockRate}`).join(', '));

      // Check if device can consume these RTP parameters
      try {
        // The device should have a method to check if it can consume
        // This is done internally by mediasoup, but we can validate codecs match
        const deviceCodecs = this.device.rtpCapabilities.codecs || [];
        const requiredCodecs = rtpParameters.codecs || [];

        const canConsume = requiredCodecs.some(reqCodec => {
          return deviceCodecs.some(devCodec => {
            return devCodec.mimeType === reqCodec.mimeType &&
              devCodec.clockRate === reqCodec.clockRate;
          });
        });

        if (!canConsume) {
          console.error('No matching codecs found between device and RTP parameters');
          console.error('Device codecs:', deviceCodecs.map(c => `${c.mimeType}/${c.clockRate}`));
          console.error('Required codecs:', requiredCodecs.map(c => `${c.mimeType}/${c.clockRate}`));
          return null;
        }
      } catch (e) {
        console.warn('Could not validate codec compatibility:', e);
        // Continue anyway - mediasoup will validate
      }

      // Determine media type based on kind
      const mediaTypeValue = kind === 'audio' ? mediaType.audio : mediaType.video;

      let codecOptions = {};

      // Ensure transport is connected before consuming
      // Wait for transport to be ready (with timeout)
      let retries = 0;
      const maxRetries = 20; // Increased retries
      let transportReady = false;

      while (retries < maxRetries && !transportReady) {
        try {
          const transportState = this.consumerTransport.connectionState;
          const isConnected = this.consumerTransport._isConnected === true;

          if (transportState === 'connected' && isConnected) {
            transportReady = true;
            break; // Transport is ready
          } else if (transportState === 'failed' || transportState === 'closed') {
            console.error(`Consumer transport is ${transportState}, cannot consume`);
            return null;
          }
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 150));
          retries++;
        } catch (e) {
          // connectionState might not be available, check our custom flag
          if (this.consumerTransport._isConnected === true) {
            transportReady = true;
            break;
          }
          if (e.message && e.message.includes('transport')) {
            console.error('Transport error:', e);
            return null;
          }
          // Continue waiting
          await new Promise(resolve => setTimeout(resolve, 150));
          retries++;
        }
      }

      if (!transportReady) {
        console.warn('Consumer transport not ready after waiting, attempting consume anyway');
      }

      // Add a small delay to ensure transport is ready (helps with race conditions)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wrap consume in try-catch to handle SDP errors gracefully
      let consumer;
      try {
        consumer = await this.consumerTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          codecOptions,
          appData: {
            producerSocketId, // Store the socket ID of the producer
            mediaType: mediaTypeValue // Store the media type
          }
        });
      } catch (consumeError) {
        // Check if it's an SDP-related error
        if (consumeError.message && (
          consumeError.message.includes('setRemoteDescription') ||
          consumeError.message.includes('recv parameters') ||
          consumeError.message.includes('ERROR_CONTENT') ||
          consumeError.message.includes('m-section')
        )) {
          console.error('SDP negotiation error during consume:', consumeError);
          console.error('This usually indicates a codec mismatch or RTP capabilities incompatibility');
          console.error('RTP Parameters received:', JSON.stringify(rtpParameters, null, 2));
          console.error('Device RTP Capabilities:', JSON.stringify(this.device.rtpCapabilities, null, 2));

          // Try to identify the problematic codec
          if (rtpParameters.codecs) {
            console.error('Codecs in RTP parameters:',
              rtpParameters.codecs.map(c => ({
                mimeType: c.mimeType,
                clockRate: c.clockRate,
                channels: c.channels,
                payloadType: c.payloadType
              }))
            );
          }

          return null;
        }
        // Re-throw other errors
        throw consumeError;
      }

      const stream = new MediaStream();
      stream.addTrack(consumer.track);


      return {
        consumer,
        stream,
        kind,
        appData: {
          producerSocketId,
          mediaType: mediaTypeValue
        }
      };
    } catch (error) {
      console.error('Error getting consume stream:', error);
      // Log more details about the error
      if (error.message) {
        if (error.message.includes('recv parameters') || error.message.includes('ERROR_CONTENT')) {
          console.error('RTP capabilities mismatch or transport not ready.');
          console.error('Device RTP capabilities:', JSON.stringify(this.device.rtpCapabilities, null, 2));
          console.error('Consumer transport ID:', this.consumerTransport?.id);
          console.error('Producer ID:', producerId);

          // Try to get more info about the transport state
          try {
            console.error('Transport connection state:', this.consumerTransport?.connectionState);
          } catch (e) {
            // Ignore if connectionState is not accessible
          }
        }
      }
      return null;
    }
  }

  closeProducer(type) {
    if (!this.producerLabel.has(type)) {
      return
    }

    // Prevent unmuting audio if muted by trainer
    if (type === mediaType.audio) {
      const isMutedByTrainer = this.mutedParticipants.get(this.socket.id) || false;
      if (isMutedByTrainer) {
        if (typeof showWarningNotification === 'function') {
          showWarningNotification('Your microphone has been muted by the trainer. You cannot unmute yourself.', 'Microphone Muted');
        }
        return;
      }
    }

    let producer_id = this.producerLabel.get(type)

    this.socket.emit('producerClosed', {
      producer_id
    })

    const producer = this.producers.get(producer_id)
    if (producer) {
      producer.close()
      this.producers.delete(producer_id)
      this.producerLabel.delete(type)
      this.updateCaptureButtonVisibility()

      if (type !== mediaType.audio) {
        // Find the local video container
        const container = document.getElementById(`container-local-${socket.id}`);
        if (container) {
          const video = container.querySelector('video');
          const profilePic = container.querySelector('.profile-pic-placeholder');
          if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(function (track) {
              track.stop()
            })
            video.srcObject = null;
            // Hide video and show profile pic when video stops
            video.style.display = 'none';
            if (profilePic) {
              profilePic.style.display = 'flex';
            }
          } else if (video) {
            // Even if no srcObject, ensure profile pic is shown
            video.style.display = 'none';
            if (profilePic) {
              profilePic.style.display = 'flex';
            }
          }
        }
      }

      switch (type) {
        case mediaType.audio:
          this.event(_EVENTS.stopAudio)
          break
        case mediaType.video:
          this.event(_EVENTS.stopVideo)
          break
        case mediaType.screen:
          this.event(_EVENTS.stopScreen)
          break
        default:
          return
      }

      // Update participants list to reflect the closed producer
      this.getParticipants()
    }
  }

  pauseProducer(type) {
    if (!this.producerLabel.has(type)) {
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).pause()
  }

  resumeProducer(type) {
    if (!this.producerLabel.has(type)) {
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).resume()
  }

  removeConsumer(consumer_id) {
    try {
      const consumer = this.consumers.get(consumer_id);
      if (!consumer) return;

      // Get the producer socket ID
      const producerSocketId = consumer.appData ? consumer.appData.producerSocketId : null;

      // Find the container
      const container = document.getElementById(`container-${consumer_id}`);
      if (container) {
        // Remove video element but keep container (will show profile pic)
        const video = container.querySelector('video');
        if (video && video.id === consumer_id) {
          video.remove();

          // Show profile pic if container still exists
          const profilePic = container.querySelector('.profile-pic-placeholder');
          if (profilePic) {
            profilePic.style.display = 'flex';
          }
        }

        // Only remove container if no other video consumers exist for this participant
        if (producerSocketId) {
          const hasOtherVideoConsumers = Array.from(this.consumers.values()).some(c => {
            return c.appData &&
              c.appData.producerSocketId === producerSocketId &&
              c.id !== consumer_id &&
              c.kind === 'video';
          });

          if (!hasOtherVideoConsumers) {
            // No other video consumers, but keep container showing profile pic
            // Container will be removed when participant leaves
          }
        }
      }

      // Remove the consumer
      this.consumers.delete(consumer_id);
      consumer.close();

      // Update the layout
      updateLayout();

      // Update participants list
      this.updateParticipantsList();
    } catch (error) {
      console.error('Error removing consumer:', error);
    }
  }

  async exit(offline = false) {
    try {
      // Track attendance - leave session (before reload)
      if (this.room_id && !offline) {
        try {
          await this.trackAttendance(this.room_id, 'leave', this.name);
        } catch (err) {
          console.error('Failed to track attendance (leave):', err);
          // Continue with exit even if attendance tracking fails
        }
      }

      window.location.reload();
      // Close all producers
      this.producers.forEach((producer) => {
        producer.close();
      });
      this.producers.clear();

      // Close all consumers
      this.consumers.forEach((consumer) => {
        consumer.close();
      });
      this.consumers.clear();

      // Close transports
      if (this.producerTransport) {
        this.producerTransport.close();
      }
      if (this.consumerTransport) {
        this.consumerTransport.close();
      }

      // Clear all video containers
      const remoteVideosContainer = document.getElementById('remoteVideos');
      if (remoteVideosContainer) {
        remoteVideosContainer.innerHTML = '';
      }

      // Local video is now in remoteVideos container, so no need to clear separately

      // Clear audio elements
      const remoteAudioContainer = document.getElementById('remoteAudio');
      if (remoteAudioContainer) {
        remoteAudioContainer.innerHTML = '';
      }

      // Hide all call-related UI elements
      const callContainer = document.getElementById('videoMedia');
      const loginContainer = document.getElementById('loginContainer');
      const participantsPanel = document.getElementById('participantsPanel');
      const capturedImagesContainer = document.getElementById('capturedImagesContainer');
      const captureButton = document.querySelector('.capture-button');
      const poseButton = document.getElementById('poseDetectionButton');
      const toggleCapturedImagesBtn = document.getElementById('toggleCapturedImages');

      if (callContainer) callContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'block';
      if (participantsPanel) participantsPanel.style.display = 'none';
      if (capturedImagesContainer) capturedImagesContainer.style.display = 'none';
      if (captureButton) captureButton.style.display = 'none';
      if (poseButton) poseButton.style.display = 'none';
      if (toggleCapturedImagesBtn) toggleCapturedImagesBtn.style.display = 'none';

      // Clear any remaining overlays or countdowns
      const countdowns = document.querySelectorAll('.capture-countdown');
      countdowns.forEach(countdown => countdown.remove());

      // Clear any captured images
      if (capturedImagesContainer) {
        capturedImagesContainer.innerHTML = '';
      }

      // Update layout
      updateLayout();

      // Update participants list
      this.updateParticipantsList();

      // Emit exit event
      this.event(RoomClient.EVENTS.exitRoom);

      // Close socket connection if not offline
      if (!offline) {
        this.socket.disconnect();
      }

      this._isOpen = false;

      // Remove beforeunload handler
      if (this.beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      }

      // Reset any global variables or states
      this.participants = [];
      this.participantContainers.clear();
      this.capturedImages.clear();
      this.latestCapturedPose = null;
      this.poseDetectionActive = false;
      if (this.poseDetection) {
        this.stopPoseDetection();
      }

      // Refresh the window
    } catch (error) {
      console.error('Error during exit:', error);
    }
  }

  ///////  HELPERS //////////

  async roomInfo() {
    let info = await this.socket.request('getMyRoomInfo')
    return info
  }

  static get mediaType() {
    return mediaType
  }

  event(evt) {
    if (this.eventListeners.has(evt)) {
      this.eventListeners.get(evt).forEach((callback) => callback())
    }
  }

  on(evt, callback) {
    this.eventListeners.get(evt).push(callback)
  }

  //////// GETTERS ////////

  isOpen() {
    return this._isOpen
  }

  static get EVENTS() {
    return _EVENTS
  }

  //////// UTILITY ////////

  copyURL() {
    let tmpInput = document.createElement('input')
    document.body.appendChild(tmpInput)
    tmpInput.value = window.location.href
    tmpInput.select()
    document.execCommand('copy')
    document.body.removeChild(tmpInput)
  }

  showDevices() {
    if (!this.isDevicesVisible) {
      reveal(devicesList)
      this.isDevicesVisible = true
    } else {
      hide(devicesList)
      this.isDevicesVisible = false
    }
  }

  handleFS(id) {
    let videoPlayer = document.getElementById(id);
    if (!videoPlayer) return;

    // Get the container if it exists
    const container = videoPlayer.closest('.video-container');
    const elementToFullscreen = container || videoPlayer;

    elementToFullscreen.addEventListener('fullscreenchange', (e) => {
      if (videoPlayer.controls) return;
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        elementToFullscreen.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    elementToFullscreen.addEventListener('webkitfullscreenchange', (e) => {
      if (videoPlayer.controls) return;
      let webkitIsFullScreen = document.webkitIsFullScreen;
      if (!webkitIsFullScreen) {
        elementToFullscreen.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    // Disabled: Click handler that triggers fullscreen removed
    // Videos will no longer go fullscreen on click
    // elementToFullscreen.addEventListener('click', (e) => {
    //   if (videoPlayer.controls) return;
    //   if (!this.isVideoOnFullScreen) {
    //     if (elementToFullscreen.requestFullscreen) {
    //       elementToFullscreen.requestFullscreen();
    //     } else if (elementToFullscreen.webkitRequestFullscreen) {
    //       elementToFullscreen.webkitRequestFullscreen();
    //     } else if (elementToFullscreen.msRequestFullscreen) {
    //       elementToFullscreen.msRequestFullscreen();
    //     }
    //     this.isVideoOnFullScreen = true;
    //     elementToFullscreen.style.pointerEvents = 'none';
    //   } else {
    //     if (document.exitFullscreen) {
    //       document.exitFullscreen();
    //     } else if (document.webkitCancelFullScreen) {
    //       document.webkitCancelFullScreen();
    //     } else if (document.msExitFullscreen) {
    //       document.msExitFullscreen();
    //     }
    //     this.isVideoOnFullScreen = false;
    //     elementToFullscreen.style.pointerEvents = 'auto';
    //   }
    // });
  }

  async kickParticipant(peerId) {
    try {
      const result = await this.socket.request('kickParticipant', { peerId })
      if (result.error) {
        console.error('Failed to kick participant:', result.error)
      } else {
        // Refresh the participants list after successful kick
        this.getParticipants()
      }
    } catch (err) {
      console.error('Error kicking participant:', err)
    }
  }

  // Add this method to make the local video draggable
  initDraggableLocalVideo() {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    // Add corner position indicator and controls
    const cornerControls = document.createElement('div');
    cornerControls.className = 'corner-controls';
    cornerControls.innerHTML = `
      <div class="corner-control top-left" data-position="top-left"></div>
      <div class="corner-control top-right" data-position="top-right"></div>
      <div class="corner-control bottom-left" data-position="bottom-left"></div>
      <div class="corner-control bottom-right" data-position="bottom-right"></div>
    `;

    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';

    localVideo.appendChild(cornerControls);
    localVideo.appendChild(dragHandle);

    // Add event listeners to corner controls
    const controls = cornerControls.querySelectorAll('.corner-control');
    controls.forEach(control => {
      control.addEventListener('click', () => {
        const position = control.dataset.position;
        this.moveLocalVideoToCorner(position);
      });
    });

    // Variables for drag functionality
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // Make the local video draggable
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(window.getComputedStyle(localVideo).left);
      startTop = parseInt(window.getComputedStyle(localVideo).top);

      // Add dragging class
      localVideo.classList.add('dragging');

      // Prevent default behavior
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Calculate new position
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Apply constraints to keep within viewport
      const maxLeft = window.innerWidth - localVideo.offsetWidth;
      const maxTop = window.innerHeight - localVideo.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      // Update position
      localVideo.style.left = `${newLeft}px`;
      localVideo.style.top = `${newTop}px`;

      // Remove any position classes
      localVideo.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right');
      this.localVideoPosition = 'custom';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;

      // Remove dragging class
      localVideo.classList.remove('dragging');

      // Snap to nearest corner
      this.snapToNearestCorner();
    });

    // Initial position
    this.moveLocalVideoToCorner(this.localVideoPosition);
  }

  // Method to move local video to a specific corner
  moveLocalVideoToCorner(position) {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    // Remove all position classes
    localVideo.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right', 'custom');

    // Add the new position class
    localVideo.classList.add(position);

    // Reset inline styles
    localVideo.style.left = '';
    localVideo.style.top = '';

    // Store current position
    this.localVideoPosition = position;

    // Update active state in controls
    const controls = localVideo.querySelectorAll('.corner-control');
    controls.forEach(control => {
      if (control.dataset.position === position) {
        control.classList.add('active');
      } else {
        control.classList.remove('active');
      }
    });
  }

  // Method to snap to the nearest corner when dragging ends
  snapToNearestCorner() {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    const rect = localVideo.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determine which corner is closest
    const isTop = centerY < windowHeight / 2;
    const isLeft = centerX < windowWidth / 2;

    let position;
    if (isTop && isLeft) position = 'top-left';
    else if (isTop && !isLeft) position = 'top-right';
    else if (!isTop && isLeft) position = 'bottom-left';
    else position = 'bottom-right';

    // Move to that corner
    this.moveLocalVideoToCorner(position);
  }

  // Add a method to restart ICE if needed
  async restartIce(transport) {
    try {
      if (transport.connectionState === 'failed') {

        // Get new ICE parameters from the server
        const { iceParameters } = await this.socket.request('restartIce', {
          transportId: transport.id
        });

        // Restart ICE
        await transport.restartIce({ iceParameters });
      }
    } catch (error) {
      console.error('Error restarting ICE:', error);
    }
  }

  async recreateProducerTransport() {

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {

      try {
        // Close existing transport
        if (this.producerTransport) {
          this.producerTransport.close();
        }

        // Create new transport
        const data = await this.socket.request('createWebRtcTransport', {
          forceTcp: false,
          rtpCapabilities: this.device.rtpCapabilities
        });

        if (data.error) {
          throw new Error(data.error);
        }

        this.producerTransport = this.device.createSendTransport(data);

        // Reattach event handlers
        this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
        });

        this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            });
            callback({ id: producer_id });
          } catch (err) {
            errback(err);
          }
        });

        // Restart all producers
        for (const [type, producerId] of this.producerLabel.entries()) {
          const producer = this.producers.get(producerId);
          if (producer) {
            await this.produce(type);
          }
        }

        return true;
      } catch (error) {
        console.error('Failed to recreate transport:', error);
        return false;
      }
    } else {
      console.error('Max retry attempts reached. Transport recovery failed.');
      // Notify user or take appropriate action
      this.event(_EVENTS.transportError);
    }
  }

  async handleTransportFailure() {

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {

      try {
        // Close existing transport
        if (this.producerTransport) {
          this.producerTransport.close();
        }

        // Create new transport
        const data = await this.socket.request('createWebRtcTransport', {
          forceTcp: false,
          rtpCapabilities: this.device.rtpCapabilities
        });

        if (data.error) {
          throw new Error(data.error);
        }

        this.producerTransport = this.device.createSendTransport(data);

        // Reattach event handlers
        this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
        });

        this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            });
            callback({ id: producer_id });
          } catch (err) {
            errback(err);
          }
        });

        // Restart all producers
        for (const [type, producerId] of this.producerLabel.entries()) {
          const producer = this.producers.get(producerId);
          if (producer) {
            await this.produce(type);
          }
        }

        return true;
      } catch (error) {
        console.error('Failed to recreate transport:', error);
        return false;
      }
    } else {
      console.error('Max retry attempts reached. Transport recovery failed.');
      // Notify user or take appropriate action
      this.event(_EVENTS.transportError);
    }
  }

  // Add new methods for image capture functionality
  captureAndBroadcastImage() {
    // Get the video element using the correct selector
    const videoElement = document.querySelector(`#container-local-${this.socket.id} video`)
    if (!videoElement) {
      console.error('No video element found for capture')
      return
    }

    // Get the video container
    const videoContainer = videoElement.closest('.video-container')
    if (!videoContainer) {
      console.error('No video container found for capture')
      return
    }

    // Get the capture button
    const captureButton = document.querySelector('.capture-button')
    if (!captureButton) {
      console.error('No capture button found')
      return
    }

    console.log('Starting image capture process...')

    // Hide capture button
    captureButton.style.display = 'none'

    // Create cancel button
    const cancelButton = document.createElement('button')
    cancelButton.innerHTML = 'Cancel'
    cancelButton.className = 'cancel-capture-button'
    cancelButton.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 1000;
      padding: 10px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    `

    // Add cancel button to document
    document.body.appendChild(cancelButton)

    // Create countdown overlay if it doesn't exist
    let countdownOverlay = videoContainer.querySelector('.capture-countdown')
    if (!countdownOverlay) {
      countdownOverlay = document.createElement('div')
      countdownOverlay.className = 'capture-countdown'
      videoContainer.appendChild(countdownOverlay)
    }

    // Show countdown overlay
    countdownOverlay.classList.remove('hidden')

    // Start countdown
    let count = 10
    countdownOverlay.textContent = count

    const countdownInterval = setInterval(() => {
      count--
      countdownOverlay.textContent = count

      if (count <= 0) {
        clearInterval(countdownInterval)
        countdownOverlay.classList.add('hidden')

        console.log('Capturing image...')

        // Set canvas dimensions to match video
        this.captureCanvas.width = videoElement.videoWidth
        this.captureCanvas.height = videoElement.videoHeight

        // Draw the current video frame to the canvas
        this.captureContext.drawImage(videoElement, 0, 0)

        // Get the image data as base64
        const imageData = this.captureCanvas.toDataURL('image/jpeg')

        // Create timestamp
        const timestamp = new Date().toISOString()

        // Store the captured image
        this.capturedImages.set(timestamp, imageData)

        console.log('Broadcasting image to peers...', this.socket)

        // Broadcast the image to all peers
        this.socket.emit('captureAndBroadcastImage', {
          imageData,
          timestamp
        })

        // Display the image locally
        this.displayCapturedImage(imageData, timestamp, this.socket.id)

        console.log('Image capture and broadcast completed')

        // Remove cancel button and show capture button
        cancelButton.remove()
        captureButton.style.display = 'block'
      }
    }, 1000)

    // Add click handler for cancel button
    cancelButton.addEventListener('click', () => {
      clearInterval(countdownInterval)
      countdownOverlay.classList.add('hidden')
      cancelButton.remove()
      captureButton.style.display = 'block'
    })
  }

  displayCapturedImage(imageData, timestamp, capturedBy) {
    console.log('Displaying captured image...');

    // Create image container if it doesn't exist
    let container = document.getElementById('capturedImagesContainer');
    if (!container) {
      console.log('Creating captured images container...');
      container = document.createElement('div');
      container.id = 'capturedImagesContainer';
      container.className = 'captured-images-container hidden';
      document.body.appendChild(container);

      // Create toggle button if it doesn't exist
      let toggleButton = document.getElementById('toggleCapturedImages');
      if (!toggleButton) {
        console.log('Creating toggle button for captured images...');
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggleCapturedImages';
        toggleButton.className = 'toggle-captured-images-btn';
        toggleButton.innerHTML = '<i class="fas fa-images"></i>';
        toggleButton.title = 'Toggle Captured Images';

        toggleButton.addEventListener('click', () => {
          container.classList.toggle('hidden');
          toggleButton.classList.toggle('active');
        });

        document.body.appendChild(toggleButton);
      }
    }

    // Create image wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'captured-image-wrapper';

    // Create timestamp element
    const timestampEl = document.createElement('div');
    timestampEl.className = 'captured-image-timestamp';
    timestampEl.textContent = new Date(timestamp).toLocaleTimeString();

    // Create image element
    const img = document.createElement('img');
    img.className = 'captured-image';
    img.src = imageData;
    img.alt = 'Captured pose';

    console.log('Image elements created, adding to container...');

    // Add elements to wrapper
    wrapper.appendChild(timestampEl);
    wrapper.appendChild(img);

    // Add wrapper to container
    container.appendChild(wrapper);

    // Show container if it was hidden
    container.classList.remove('hidden');

    console.log('Image display completed');

    // Try to detect pose from the captured image if pose detection is available
    if (window.poseDetection) {
      console.log('Attempting pose detection on captured image...');
      // Create a temporary canvas element to load the image
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      const tempImage = new Image();

      tempImage.onload = async () => {
        try {
          // Set canvas dimensions to match image
          tempCanvas.width = tempImage.width;
          tempCanvas.height = tempImage.height;

          // Draw image to canvas
          tempContext.drawImage(tempImage, 0, 0);

          // Initialize detector if not already initialized
          if (!window.poseDetection.detector) {
            try {
              console.log('Initializing pose detector...');
              // Create detector using TensorFlow.js pose detection
              const detectorConfig = {
                modelType: 'SinglePose.Lightning',
                enableSmoothing: true,
                minPoseScore: 0.3
              };
              window.poseDetection.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                detectorConfig
              );
              console.log('Pose detector initialized successfully');
            } catch (error) {
              console.error('Error initializing pose detector:', error);
              throw error;
            }
          }

          // Detect pose from the canvas
          console.log('Detecting pose from image...');
          const poses = await window.poseDetection.detector.estimatePoses(tempCanvas);
          if (poses && poses.length > 0) {
            const poseData = poses[0];

            // Ensure we have valid keypoints
            if (poseData.keypoints && poseData.keypoints.length > 0) {
              console.log('Pose detected successfully');
              // Store pose data with the image
              if (window.poseDetection.storePoseDataWithImage) {
                window.poseDetection.storePoseDataWithImage(img, poseData)
              }

              // Update latest captured pose
              this.latestCapturedPose = poseData;

              // If we're in captured mode, update the pose detection
              if (this.poseComparisonMode === 'captured') {
                this.stopPoseDetection();
                this.startPoseDetection();
              }
            } else {
              console.warn('No valid keypoints found in detected pose');
            }
          } else {
            console.warn('No poses detected in captured image');
          }
        } catch (error) {
          console.error('Error detecting pose from captured image:', error);
        } finally {
          // Clean up
          tempCanvas.remove();
          tempImage.remove();
        }
      };

      // Handle image load errors
      tempImage.onerror = (error) => {
        console.error('Error loading image for pose detection:', error);
        tempCanvas.remove();
        tempImage.remove();
      };

      // Start loading the image
      tempImage.src = imageData;
    } else {
      console.warn('Pose detection not available for captured image');
    }
  }

  // Add method to create capture button
  createCaptureButton() {
    const button = document.createElement('button')
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-440ZM144.62-160Q117-160 98.5-178.5 80-197 80-224.62v-430.76Q80-683 98.5-701.5 117-720 144.62-720h118.3l74-80h207.7v40H354.23l-73.77 80H144.62q-10.77 0-17.7 6.92-6.92 6.93-6.92 17.7v430.76q0 10.77 6.92 17.7 6.93 6.92 17.7 6.92h590.76q10.77 0 17.7-6.92 6.92-6.93 6.92-17.7v-320h40v320q0 27.62-18.5 46.12Q763-160 735.38-160H144.62ZM760-680v-80h-80v-40h80v-80h40v80h80v40h-80v80h-40ZM440-290.77q62.69 0 105.96-43.27 43.27-43.27 43.27-105.96 0-62.69-43.27-105.96-43.27-43.27-105.96-43.27-62.69 0-105.96 43.27-43.27 43.27-43.27 105.96 0 62.69 43.27 105.96 43.27 43.27 105.96 43.27Zm0-40q-46.62 0-77.92-31.31-31.31-31.3-31.31-77.92 0-46.62 31.31-77.92 31.3-31.31 77.92-31.31 46.62 0 77.92 31.31 31.31 31.3 31.31 77.92 0 46.62-31.31 77.92-31.3 31.31-77.92 31.31Z"/></svg>'
    button.className = 'capture-button'
    button.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 1000;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      width: 44px;
      height: 44px;
      display: none;
      align-items: center;
      justify-content: center;
    `

    button.addEventListener('click', () => {
      this.captureAndBroadcastImage()
    })

    document.body.appendChild(button)
  }

  updateCaptureButtonVisibility() {
    const captureButton = document.querySelector('.capture-button');
    if (captureButton) {
      const hasVideoProducer = this.producerLabel.has(mediaType.video);
      captureButton.style.display = hasVideoProducer ? 'flex' : 'none';
    }
  }

  // Toggle pin state for a video (only one video can be pinned at a time)
  togglePinVideo(socketId) {
    const isPinned = this.pinnedVideos.get(socketId) || false;

    // Helper function to update pin button icon
    const updatePinButton = (container, pinned) => {
      const pinButton = container.querySelector('.video-pin-btn');
      if (pinButton) {
        pinButton.setAttribute('aria-label', pinned ? 'Unpin video' : 'Pin video');
        pinButton.innerHTML = pinned
          ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8c0 1.1-.9 2-2 2s-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2s-2-.9-2-2z" opacity="0.6"/></svg>';
      }
    };

    // If clicking on already pinned video, unpin it
    if (isPinned) {
      this.pinnedVideos.set(socketId, false);
      const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
      containers.forEach(container => {
        container.classList.remove('pinned');
        updatePinButton(container, false);
      });
    } else {
      // Unpin any currently pinned video (only one can be pinned)
      this.pinnedVideos.forEach((pinned, existingSocketId) => {
        if (pinned && existingSocketId !== socketId) {
          this.pinnedVideos.set(existingSocketId, false);
          const existingContainers = Array.from(document.querySelectorAll(`[data-socket-id="${existingSocketId}"]`));
          existingContainers.forEach(container => {
            container.classList.remove('pinned');
            updatePinButton(container, false);
          });
        }
      });

      // Pin the new video
      this.pinnedVideos.set(socketId, true);
      const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
      containers.forEach(container => {
        container.classList.add('pinned');
        updatePinButton(container, true);
      });
    }

    // Update layout to show pinned video prominently
    updateLayout();
  }

  // Update pin button visual state (no longer needed, but kept for compatibility)
  updatePinButtonState(socketId) {
    // Pin state is now handled by CSS classes on the container
    // This method is kept for compatibility but does nothing
  }

  // Toggle mute state for a participant (trainer only)
  async toggleMuteParticipant(targetSocketId) {
    if (!this.isTrainer) {
      console.warn('Only trainers can mute participants');
      return;
    }

    if (targetSocketId === this.socket.id) {
      console.warn('Cannot mute yourself');
      return;
    }

    const isMuted = this.mutedParticipants.get(targetSocketId) || false;

    try {
      if (isMuted) {
        // Unmute
        const result = await this.socket.request('unmuteParticipantAudio', {
          targetPeerId: targetSocketId
        });
        if (result.success) {
          this.mutedParticipants.set(targetSocketId, false);
          this.updateMuteButtonsForParticipant(targetSocketId, false);
        }
      } else {
        // Mute
        const result = await this.socket.request('muteParticipantAudio', {
          targetPeerId: targetSocketId
        });
        if (result.success) {
          this.mutedParticipants.set(targetSocketId, true);
          this.updateMuteButtonsForParticipant(targetSocketId, true);
        }
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      if (typeof showErrorNotification === 'function') {
        showErrorNotification('Failed to mute/unmute participant');
      }
    }
  }

  // Update mute button icon
  updateMuteButton(button, isMuted) {
    if (!button) return;

    // Check if button is disabled (audio is off)
    if (button.disabled || button.classList.contains('disabled')) {
      return; // Don't update disabled buttons
    }

    button.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
    if (isMuted) {
      // Muted icon (microphone with slash)
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
      button.classList.add('muted');
    } else {
      // Unmuted icon (microphone)
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>';
      button.classList.remove('muted');
    }
  }

  // Update all mute buttons for a specific participant
  updateMuteButtonsForParticipant(socketId, isMuted) {
    const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
    containers.forEach(container => {
      const muteButton = container.querySelector('.video-mute-btn');
      if (muteButton) {
        // Check if participant has audio
        const hasAudio = this.hasProducer(socketId, mediaType.audio);

        if (!hasAudio) {
          // Audio is off - show disabled state
          muteButton.classList.add('disabled');
          muteButton.disabled = true;
          muteButton.setAttribute('aria-label', 'Audio is off');
          muteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
        } else {
          // Audio is on - update mute button state
          muteButton.classList.remove('disabled');
          muteButton.disabled = false;
          this.updateMuteButton(muteButton, isMuted);
        }
      }
    });
  }

  // Update mute indicator in video overlay for a participant
  updateParticipantMuteIndicator(socketId, isMuted) {
    const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
    containers.forEach(container => {
      const videoInfo = container.querySelector('.video-info');
      if (videoInfo) {
        let muteIndicator = videoInfo.querySelector('.video-mute-indicator');

        if (isMuted && !muteIndicator) {
          // Add mute indicator
          muteIndicator = document.createElement('span');
          muteIndicator.className = 'video-mute-indicator';
          muteIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>';
          muteIndicator.setAttribute('title', 'Audio muted by trainer');

          // Insert after video name, before trainer badge
          const videoName = videoInfo.querySelector('.video-name');
          if (videoName && videoName.nextSibling) {
            videoInfo.insertBefore(muteIndicator, videoName.nextSibling);
          } else {
            videoInfo.appendChild(muteIndicator);
          }
        } else if (!isMuted && muteIndicator) {
          // Remove mute indicator
          muteIndicator.remove();
        }
      }
    });
  }

  // Update local audio button state when muted by trainer
  updateLocalAudioMutedState(isMuted) {
    const startAudioButton = document.getElementById('startAudioButton');
    const stopAudioButton = document.getElementById('stopAudioButton');

    if (isMuted) {
      // Show muted state - disable the stop button and show muted icon
      if (stopAudioButton) {
        stopAudioButton.classList.add('muted-by-trainer');
        stopAudioButton.style.cursor = 'not-allowed';
        stopAudioButton.style.opacity = '0.7';
        // Update icon to show muted state (red microphone with slash)
        const svg = stopAudioButton.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', '#ef4444');
          svg.innerHTML = '<path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z"/>';
        }
        // Prevent clicking to unmute when muted by trainer
        stopAudioButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof showWarningNotification === 'function') {
            showWarningNotification('Your microphone has been muted by the trainer. You cannot unmute yourself.', 'Microphone Muted');
          }
        };
      }
    } else {
      // Restore normal state
      if (stopAudioButton) {
        stopAudioButton.classList.remove('muted-by-trainer');
        stopAudioButton.style.cursor = '';
        stopAudioButton.style.opacity = '';
        // Restore normal icon
        const svg = stopAudioButton.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', '#e3e3e3');
          svg.innerHTML = '<path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>';
        }
        // Restore normal onclick handler
        stopAudioButton.onclick = () => {
          rc.closeProducer(RoomClient.mediaType.audio);
        };
      }
    }
  }

  initPoseComparison() {
    const poseDetectionMode = document.getElementById('poseDetectionMode');
    if (poseDetectionMode) {
      poseDetectionMode.addEventListener('change', (e) => {
        this.poseComparisonMode = e.target.value;

        // Update pose detection when mode changes
        if (this.poseDetectionActive) {
          this.stopPoseDetection();
          this.startPoseDetection();
        }
      });
    }
  }

  startPoseDetection() {
    if (!this.poseDetection) {
      console.error('Pose detection not initialized');
      return;
    }

    // Get the video element
    const videoElement = document.querySelector(`#container-local-${this.socket.id} video`);
    if (!videoElement) {
      console.error('No video element found');
      return;
    }

    // Get the video container
    const videoContainer = videoElement.closest('.video-container');
    if (!videoContainer) {
      console.error('No video container found');
      return;
    }

    // Start pose detection with the appropriate comparison mode
    this.poseDetection.startDetection(videoElement, videoContainer, {
      comparisonMode: this.poseComparisonMode,
      referencePose: this.poseComparisonMode === 'captured' ? this.latestCapturedPose : null
    });
  }

  stopPoseDetection() {
    if (this.poseDetection) {
      this.poseDetection.stopDetection();
    }
  }
}
