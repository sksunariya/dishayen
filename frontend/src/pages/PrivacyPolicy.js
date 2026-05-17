import React from 'react';
import { FiShield } from 'react-icons/fi';
import LegalPage from './LegalPage';

const PrivacyPolicy = () => (
  <LegalPage settingKey="privacyPolicy" title="Privacy Policy" icon={FiShield} />
);

export default PrivacyPolicy;
