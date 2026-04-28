import React from 'react';

const Modal = ({ id, isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay open`} id={id} onClick={(e) => e.target.id === id && onClose()}>
      <div className="modal">
        {title && <h2>{title}</h2>}
        {children}
        {footer && <div className="modal-btns">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
