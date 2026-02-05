'use client';

import React from 'react';
import { Dialog } from './dialog';

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  return <Dialog>{children}</Dialog>;
};
