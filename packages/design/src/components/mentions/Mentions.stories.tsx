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

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

import { Mentions } from './Mentions';

const meta: Meta<typeof Mentions> = {
    title: 'Components / Mentions',
    component: Mentions,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

export const InputBasic = {

    render() {
        const [value, onChange] = useState('');

        return (
            <div style={{ width: 400 }}>
                <Mentions
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <Mentions.Mention
                        trigger="@"
                        data={[
                            {
                                id: '1',
                                display: 'zhangwei ',
                            },
                            {
                                id: '2',
                                display: 'zhangwei2 ',
                            },
                            {
                                id: '3',
                                display: 'zhangwei3 ',
                            },
                        ]}
                    />
                </Mentions>
            </div>

        );
    },
};

