import React from 'react';

const Modal = ({ id, isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id={id} onClick={(e) => e.target.id === id && onClose()}>
      <div className="modal">
        <div className="modal-header">
          {title && <div className="modal-title">{title}</div>}
        </div>
        <div className="modal-content">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
