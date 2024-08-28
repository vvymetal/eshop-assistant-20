// src/components/Message/Message.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Message.module.css';

const Message = React.memo(({ content, role }) => (
  <div className={`${styles.message} ${styles[role]}`} role="listitem">
    <ReactMarkdown>{content || ''}</ReactMarkdown>
  </div>
));

export default Message;