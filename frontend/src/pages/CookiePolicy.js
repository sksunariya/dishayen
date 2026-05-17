import React from 'react';
import { FiLock } from 'react-icons/fi';
import LegalPage from './LegalPage';

const CookiePolicy = () => (
  <LegalPage settingKey="cookiePolicy" title="Cookie Policy" icon={FiLock} />
);

export default CookiePolicy;
