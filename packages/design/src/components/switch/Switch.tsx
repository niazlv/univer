/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState } from 'react';
import styles from './index.module.less';

export interface ISwitchProps {
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
}

const Switch = (props: ISwitchProps) => {
    const [checked, setChecked] = useState(props.defaultChecked ?? false);

    const handleChange = () => {
        setChecked(!checked);
        props.onChange?.(!checked);
    };

    return (
        <div className={styles.switchWrapper}>
            <label className={styles.switch}>
                <input type="checkbox" checked={checked} onChange={handleChange} />
                <span className={styles.slider} />
            </label>
        </div>
    );
};

export { Switch };
