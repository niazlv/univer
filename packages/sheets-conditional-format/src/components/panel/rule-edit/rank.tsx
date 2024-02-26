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

import React, { useEffect, useState } from 'react';
import { useDependency } from '@wendellhu/redi/react-bindings';
import { LocaleService } from '@univerjs/core';
import { Checkbox, InputNumber, Select } from '@univerjs/design';
import { NumberOperator, RuleType, SubRuleType } from '../../../base/const';
import { ConditionalStyleEditor } from '../../conditional-style-editor';
import type { IAverageHighlightCell, IConditionalFormatRuleConfig, IHighlightCell, IRankHighlightCell } from '../../../models/type';
import stylesBase from '../index.module.less';
import { Preview } from '../../preview';
import styles from './index.module.less';
import type { IStyleEditorProps } from './type';

export const RankStyleEditor = (props: IStyleEditorProps) => {
    const { onChange, interceptorManager } = props;
    const localeService = useDependency(LocaleService);

    const rule = props.rule?.type === RuleType.highlightCell ? props.rule : undefined as IRankHighlightCell | IAverageHighlightCell | undefined;
    const options = [{ label: localeService.t('sheet.cf.panel.isNotBottom'), value: 'isNotBottom' }, { label: localeService.t('sheet.cf.panel.isBottom'), value: 'isBottom' },
        { label: localeService.t('sheet.cf.panel.greaterThanAverage'), value: 'greaterThanAverage' }, { label: localeService.t('sheet.cf.panel.lessThanAverage'), value: 'lessThanAverage' }];

    const [type, typeSet] = useState(() => {
        const defaultV = options[0].value;
        const type = rule?.type;
        if (!rule) {
            return defaultV;
        }
        switch (type) {
            case RuleType.highlightCell:{
                const subType = rule.subType;
                switch (subType) {
                    case SubRuleType.average:{
                        if ([NumberOperator.greaterThan, NumberOperator.greaterThanOrEqual].includes(rule.operator)) {
                            return 'greaterThanAverage';
                        }
                        if ([NumberOperator.lessThan, NumberOperator.lessThanOrEqual].includes(rule.operator)) {
                            return 'lessThanAverage';
                        }
                        return defaultV;
                    }
                    case SubRuleType.rank:{
                        if (rule.isBottom) {
                            return 'isBottom';
                        } else {
                            return 'isNotBottom';
                        }
                    }
                }
            }
        }
        return defaultV;
    });
    const [value, valueSet] = useState(() => {
        const defaultV = 10;
        const type = rule?.type;
        if (!rule) {
            return defaultV;
        }
        switch (type) {
            case RuleType.highlightCell:{
                const subType = rule.subType;
                switch (subType) {
                    case SubRuleType.rank:{
                        return rule.value || defaultV;
                    }
                }
            }
        }
        return defaultV;
    });
    const [isPercent, isPercentSet] = useState(() => {
        const defaultV = false;
        const type = rule?.type;
        if (!rule) {
            return defaultV;
        }
        switch (type) {
            case RuleType.highlightCell:{
                const subType = rule.subType;
                switch (subType) {
                    case SubRuleType.rank:{
                        return rule.isPercent || defaultV;
                    }
                }
            }
        }
        return defaultV;
    });

    const [style, styleSet] = useState<IHighlightCell['style']>({});

    const getResult = (config: {
        type: string;
        isPercent: boolean;
        value: number;
        style: IHighlightCell['style'];
    }) => {
        const { type, isPercent, value, style } = config;
        if (type === 'isNotBottom') {
            return { type: RuleType.highlightCell, subType: SubRuleType.rank, isPercent, isBottom: false, value, style };
        }
        if (type === 'isBottom') {
            return { type: RuleType.highlightCell, subType: SubRuleType.rank, isPercent, isBottom: true, value, style };
        }
        if (type === 'greaterThanAverage') {
            return { type: RuleType.highlightCell, subType: SubRuleType.average, operator: NumberOperator.greaterThan, style };
        }
        if (type === 'lessThanAverage') {
            return { type: RuleType.highlightCell, subType: SubRuleType.average, operator: NumberOperator.lessThan, style };
        }
    };
    useEffect(() => {
        const dispose = interceptorManager.intercept(interceptorManager.getInterceptPoints().submit, {
            handler() {
                return getResult({ type, isPercent, value, style });
            },
        });
        return dispose as () => void;
    }, [type, isPercent, value, style, interceptorManager]);

    const _onChange = (config: {
        type: string;
        isPercent: boolean;
        value: number;
        style: IHighlightCell['style'];
    }) => {
        onChange(getResult(config));
    };
    return (
        <div>
            <div className={`${stylesBase.title} ${stylesBase.mTBase}`}>{localeService.t('sheet.cf.panel.styleRule')}</div>
            <Select
                className={stylesBase.mTSm}
                value={type}
                options={options}
                onChange={(v) => {
                    typeSet(v);
                    _onChange({ type: v, isPercent, value, style });
                }}
            />
            {['isNotBottom', 'isBottom'].includes(type) && (
                <div className={`${stylesBase.labelContainer} ${stylesBase.mTSm}`}>
                    <InputNumber
                        value={value}
                        onChange={(v) => {
                            const value = v || 0;
                            valueSet(value);
                            _onChange({ type, isPercent, value, style });
                        }}
                    />
                    <div className={`${stylesBase.mLSm} ${stylesBase.labelContainer} ${styles.text}`}>
                        <Checkbox
                            checked={isPercent}
                            value={undefined as any}
                            onChange={(v) => {
                                isPercentSet(!!v);
                                _onChange({ type, isPercent: !!v, value, style });
                            }}
                        />
                        百分比
                    </div>

                </div>
            )}
            <div className={styles.cfPreviewWrap}>
                <Preview rule={getResult({ type, isPercent, value, style }) as IConditionalFormatRuleConfig} />
            </div>
            <ConditionalStyleEditor
                style={rule?.style}
                className={stylesBase.mTSm}
                onChange={(v) => {
                    styleSet(v);
                    _onChange({ type, isPercent, value, style: v });
                }}
            />
        </div>
    );
};
