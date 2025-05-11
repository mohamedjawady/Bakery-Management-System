// Enhanced hover behavior helper for sidebar
document.addEventListener('DOMContentLoaded', function() {
  // Find the sidebar element
  const sidebar = document.querySelector('.sidebar-hover-expand');
  
  if (sidebar) {
    // Add hover event listeners with a small delay
    let hoverTimeout;
    
    sidebar.addEventListener('mouseenter', function() {
      clearTimeout(hoverTimeout);
      document.documentElement.classList.add('sidebar-expanded-view');
      sidebar.classList.add('sidebar-hovered');
      
      // Explicitly handle role label visibility
      const roleLabel = sidebar.querySelector('.role-label');
      if (roleLabel) {
        roleLabel.style.opacity = '1';
        roleLabel.style.visibility = 'visible';
        roleLabel.style.display = 'block';
      }
    });
    
    sidebar.addEventListener('mouseleave', function() {
      hoverTimeout = setTimeout(() => {
        document.documentElement.classList.remove('sidebar-expanded-view');
        sidebar.classList.remove('sidebar-hovered');
        
        // Reset role label visibility
        const roleLabel = sidebar.querySelector('.role-label');
        if (roleLabel) {
          roleLabel.style.opacity = '0';
          roleLabel.style.visibility = 'hidden';
          roleLabel.style.display = 'none';
        }
      }, 100); // Small delay to prevent flickering
    });
    
    // Touch support for mobile/tablet
    sidebar.addEventListener('touchstart', function(e) {
      if (!sidebar.classList.contains('sidebar-hovered')) {
        e.preventDefault();
        sidebar.classList.add('sidebar-hovered');
        document.documentElement.classList.add('sidebar-expanded-view');
        
        // Handle role label for touch events
        const roleLabel = sidebar.querySelector('.role-label');
        if (roleLabel) {
          roleLabel.style.opacity = '1';
          roleLabel.style.visibility = 'visible';
          roleLabel.style.display = 'block';
        }
      }
    });
  }
  
  // Add a click handler to the document to close sidebar when clicking outside
  document.addEventListener('click', function(e) {
    if (sidebar && !sidebar.contains(e.target)) {
      sidebar.classList.remove('sidebar-hovered');
      document.documentElement.classList.remove('sidebar-expanded-view');
      
      // Reset role label on outside click
      const roleLabel = sidebar.querySelector('.role-label');
      if (roleLabel) {
        roleLabel.style.opacity = '0';
        roleLabel.style.visibility = 'hidden';
        roleLabel.style.display = 'none';
      }
    }
  });
});
