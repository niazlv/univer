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

import React, { useEffect, useMemo, useState } from 'react';
import { useDependency } from '@wendellhu/redi/react-bindings';
import { ThreadCommentModel } from '@univerjs/thread-comment';
import { ICommandService, LocaleService, type UniverInstanceType } from '@univerjs/core';
import { useObservable } from '@univerjs/ui';
import { Button, Select } from '@univerjs/design';
import dayjs from 'dayjs';
import type { Observable } from 'rxjs';
import { ThreadCommentTree } from '../thread-comment-tree';
import { ThreadCommentPanelService } from '../../services/thread-comment-panel.service';
import { SetActiveCommentOperation } from '../../commands/operations/comment.operations';
import styles from './index.module.less';

export interface IThreadCommentPanelProps {
    unitId: string;
    subUnitId$: Observable<string | undefined>;
    type: UniverInstanceType;
}

export const ThreadCommentPanel = (props: IThreadCommentPanelProps) => {
    const { unitId, subUnitId$, type } = props;
    const [unit, setUnit] = useState('all');
    const [status, setStatus] = useState('all');
    const localeService = useDependency(LocaleService);
    const threadCommentModel = useDependency(ThreadCommentModel);
    const [unitComments, setUnitComments] = useState(() => threadCommentModel.getUnit(unitId));
    const panelService = useDependency(ThreadCommentPanelService);
    const activeCommentId = useObservable(panelService.activeCommentId$);
    const update = useObservable(threadCommentModel.commentUpdate$);
    const commandService = useDependency(ICommandService);
    const subUnitId = useObservable(subUnitId$);
    const comments = useMemo(() => {
        if (unit === 'all') {
            return unitComments.map((i) => i[1]).flat().filter((i) => !i.parentId).map((i) => ({
                ...i,
                timestamp: dayjs(i.dT).unix(),
            })).sort((pre, aft) => pre.timestamp - aft.timestamp);
        } else {
            return unitComments.find((i) => i[0] === subUnitId)?.[1] ?? [];
        }
    }, [unit, unitComments, subUnitId]);

    const statuedComments = useMemo(() => {
        if (status === 'resolved') {
            return comments.filter((comment) => comment.resolved);
        }

        if (status === 'unsolved') {
            return comments.filter((comment) => !comment.resolved);
        }
        if (status === 'concern_me') {
            //
        }

        return comments;
    }, [comments, status]);

    const isFiltering = status !== 'all' || unit !== 'all';

    const onReset = () => {
        setStatus('all');
        setUnit('all');
    };

    useEffect(() => {
        if (unitId) {
            setUnitComments(
                threadCommentModel.getUnit(unitId)
            );
        }
    }, [unitId, threadCommentModel, update]);

    return (
        <div className={styles.threadCommentPanel}>
            <div className={styles.threadCommentPanelForms}>
                <Select
                    value={unit}
                    onChange={(e) => setUnit(e)}
                    options={[
                        {
                            value: 'current',
                            label: 'current',
                        }, {
                            value: 'all',
                            label: 'all',
                        },
                    ]}
                />
                <Select
                    value={status}
                    onChange={(e) => setStatus(e)}
                    options={[
                        {
                            value: 'all',
                            label: 'all',
                        }, {
                            value: 'resolved',
                            label: 'resolved',
                        },
                        {
                            value: 'unsolved',
                            label: 'unsolved',
                        },
                        {
                            value: 'concern_me',
                            label: 'Concern me',
                        },
                    ]}
                />
            </div>
            {statuedComments?.map((comment) => (
                <ThreadCommentTree
                    key={comment.id}
                    id={comment.id}
                    unitId={comment.unitId}
                    subUnitId={comment.subUnitId}
                    type={type}
                    showEdit={activeCommentId?.commentId === comment.id}
                    showHighlight={activeCommentId?.commentId === comment.id}
                    onClick={() => {
                        commandService.executeCommand(SetActiveCommentOperation.id, {
                            unitId,
                            subUnitId,
                            commentId: comment.id,
                        });
                    }}
                />
            ))}
            {statuedComments.length
                ? null
                : (
                    <div className={styles.threadCommentPanelEmpty}>
                        {isFiltering ? localeService.t('threadCommentUI.panel.filterEmpty') : localeService.t('threadCommentUI.panel.empty')}
                        {isFiltering ? <Button onClick={onReset} type="link">{localeService.t('threadCommentUI.panel.reset')}</Button> : null}
                    </div>
                )}
        </div>
    );
};