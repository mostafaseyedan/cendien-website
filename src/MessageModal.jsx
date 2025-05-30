
import React from 'react';

function MessageModal({ isOpen, message, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay active" onClick={onClose}> {/* Ensure .active class makes it visible */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg mb-4">{message}</p>
        <button
          onClick={onClose}
          className="modal-close-button py-2 px-4 rounded-md" // Your existing styles
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default MessageModal;
