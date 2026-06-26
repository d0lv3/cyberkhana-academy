import React from 'react';
import ModuleEditor from './ModuleEditor';

/** Back-compat shim — OS modules now use the shared, section-based ModuleEditor. */
const OSModuleEditor: React.FC = () => <ModuleEditor kind="os" />;

export default OSModuleEditor;
