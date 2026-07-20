import React, {useCallback, useContext, useState} from "react";
import {Button, Checkbox, Input, Modal, Space, Table, Tag, Tooltip} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    ApiOutlined,
    KeyOutlined,
    LinkOutlined,
} from '@ant-design/icons';
import {useStorage} from "@plasmohq/storage/dist/hook";
import {
    CUSTOM_PROVIDERS_STORAGE_KEY,
    type CustomProviderConfig,
    fetchAvailableModels,
} from "~libs/chatbot/custom-openai/types";
import IconOpenAI from "data-base64:~assets/simple-icons_openai.svg";
import {clearCachedClassesForProvider} from "~libs/chatbot/custom-openai/registry";
import {OptionsContext} from "~provider/Options";
import {LocaleContext} from "~libs/i18n";

export default function CustomProviderPage() {
    const [providers, setProviders] = useStorage<CustomProviderConfig[]>(CUSTOM_PROVIDERS_STORAGE_KEY, []);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const {messageApi} = useContext(OptionsContext);
    const {t} = useContext(LocaleContext);

    // Form state
    const [formName, setFormName] = useState('');
    const [formApiUrl, setFormApiUrl] = useState('');
    const [formApiKey, setFormApiKey] = useState('');
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);

    const resetForm = useCallback(() => {
        setFormName('');
        setFormApiUrl('');
        setFormApiKey('');
        setFetchedModels([]);
        setSelectedModels([]);
        setEditingId(null);
    }, []);

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (provider: CustomProviderConfig) => {
        setEditingId(provider.id);
        setFormName(provider.name);
        setFormApiUrl(provider.apiUrl);
        setFormApiKey(provider.apiKey);
        setFetchedModels(provider.fetchedModels || []);
        setSelectedModels(provider.enabledModels || []);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        resetForm();
    };

    const handleFetchModels = async () => {
        const url = formApiUrl.trim();
        const key = formApiKey.trim();

        if (!url) {
            messageApi.warning(t('validation.enterApiUrl'));
            return;
        }
        if (!key) {
            messageApi.warning(t('validation.enterApiKey'));
            return;
        }

        setFetching(true);
        try {
            const models = await fetchAvailableModels(url, key);
            setFetchedModels(models);
            // Pre-select newly fetched models that were previously selected
            if (selectedModels.length > 0) {
                setSelectedModels(selectedModels.filter(m => models.includes(m)));
            }
            messageApi.success(t('validation.foundModels', {count: models.length}));
        } catch (err: any) {
            messageApi.error(t('validation.fetchFailed', {message: err.message}));
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            messageApi.warning(t('validation.enterProviderName'));
            return;
        }
        if (!formApiUrl.trim()) {
            messageApi.warning(t('validation.enterApiUrlFull'));
            return;
        }
        if (!formApiKey.trim()) {
            messageApi.warning(t('validation.enterApiKeyFull'));
            return;
        }
        if (selectedModels.length === 0) {
            messageApi.warning(t('validation.selectAtLeastOneModel'));
            return;
        }

        setSaving(true);
        try {
            const now = Date.now();
            const config: CustomProviderConfig = {
                id: editingId || `custom_${now}`,
                name: formName.trim(),
                apiUrl: formApiUrl.trim().replace(/\/+$/, ''),
                apiKey: formApiKey.trim(),
                enabledModels: selectedModels,
                fetchedModels,
            };

            if (editingId) {
                // Clear registry cache so model classes are recreated
                clearCachedClassesForProvider(editingId);
                const updated = providers.map(p => p.id === editingId ? config : p);
                await setProviders(updated);
                messageApi.success(t('validation.providerUpdated'));
            } else {
                await setProviders([...providers, config]);
                messageApi.success(t('validation.providerAdded'));
            }

            closeModal();
        } catch (err: any) {
            messageApi.error(t('validation.saveFailed', {message: err.message}));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (provider: CustomProviderConfig) => {
        Modal.confirm({
            title: t('customProvider.deleteTitle'),
            icon: <DeleteOutlined style={{color: '#FF2D10'}}/>,
            content: t('customProvider.deleteConfirm', {name: provider.name}),
            okText: t('common.delete'),
            okButtonProps: {danger: true},
            cancelText: t('common.cancel'),
            onOk: async () => {
                clearCachedClassesForProvider(provider.id);
                const filtered = providers.filter(p => p.id !== provider.id);
                await setProviders(filtered);
                messageApi.success(t('validation.providerDeleted'));
            },
        });
    };

    const columns = [
        {
            title: t('customProvider.providerCol'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <Space>
                    <img src={IconOpenAI} className="w-5 h-5" alt=""/>
                    <span className="font-medium">{name}</span>
                </Space>
            ),
        },
        {
            title: t('customProvider.apiUrlCol'),
            dataIndex: 'apiUrl',
            key: 'apiUrl',
            render: (url: string) => (
                <Tooltip title={url}>
                    <span className="text-[#5E5E5E] max-w-[300px] block truncate">{url}</span>
                </Tooltip>
            ),
        },
        {
            title: t('customProvider.modelsCol'),
            dataIndex: 'enabledModels',
            key: 'enabledModels',
            render: (models: string[]) => (
                <Space wrap size={[4, 4]}>
                    {models?.slice(0, 4).map(m => (
                        <Tag key={m} color="blue">{m}</Tag>
                    ))}
                    {models?.length > 4 && <Tag>+{models.length - 4} more</Tag>}
                </Space>
            ),
        },
        {
            title: t('customProvider.actionsCol'),
            key: 'actions',
            width: 120,
            render: (_: any, record: CustomProviderConfig) => (
                <Space>
                    <Tooltip title={t('common.edit')}>
                        <Button type="text" icon={<EditOutlined/>} onClick={() => openEditModal(record)}/>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                        <Button type="text" danger icon={<DeleteOutlined/>} onClick={() => handleDelete(record)}/>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div
                className="bg-white shadow-[0_4px_12px_0px_rgba(0,0,0,.2)] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] px-[56px] py-[32px] mt-[32px] flex flex-col">
                <div className="text-[#333333] font-[700] text-[20px] justify-start">
                    {t('customProvider.title')}
                </div>
                <div className="text-[#5E5E5E] font-[400] text-[12px] justify-start mt-[8px] mb-[24px]">
                    {t('customProvider.description')}
                </div>

                {providers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-[60px] text-[#C2C2C2]">
                        <ApiOutlined style={{fontSize: 48, color: '#D9D9D9'}}/>
                        <div className="mt-[16px] text-[16px]">{t('customProvider.empty')}</div>
                        <div className="mt-[8px] text-[12px]">{t('customProvider.emptyHint')}</div>
                    </div>
                ) : (
                    <Table
                        dataSource={providers}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                    />
                )}

                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    onClick={openCreateModal}
                    className="mt-[24px] self-start bg-[#0A4DFE] h-[40px]"
                >
                    {t('customProvider.add')}
                </Button>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editingId ? t('customProvider.editTitle') : t('customProvider.addTitle')}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
                width={640}
                destroyOnClose
            >
                <div className="flex flex-col gap-[16px] mt-[16px]">
                    {/* Name */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">{t('customProvider.name')}</div>
                        <Input
                            prefix={<ApiOutlined className="text-[#C2C2C2]"/>}
                            placeholder={t('customProvider.namePlaceholder')}
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* API URL */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">{t('customProvider.apiUrl')}</div>
                        <Input
                            prefix={<LinkOutlined className="text-[#C2C2C2]"/>}
                            placeholder={t('customProvider.apiUrlPlaceholder')}
                            value={formApiUrl}
                            onChange={e => setFormApiUrl(e.target.value)}
                            size="large"
                        />
                        <div className="text-[12px] text-[#C2C2C2] mt-[4px]">
                            {t('customProvider.apiUrlHint')}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">{t('customProvider.apiKey')}</div>
                        <Input.Password
                            prefix={<KeyOutlined className="text-[#C2C2C2]"/>}
                            placeholder={t('customProvider.apiKeyPlaceholder')}
                            value={formApiKey}
                            onChange={e => setFormApiKey(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* Fetch Models */}
                    <div className="border-t border-[#F3F4F9] pt-[16px]">
                        <div className="flex items-center justify-between mb-[12px]">
                            <span className="text-[14px] font-medium text-[#333333]">{t('customProvider.availableModels')}</span>
                            <Button
                                icon={<ReloadOutlined/>}
                                onClick={handleFetchModels}
                                loading={fetching}
                                disabled={!formApiUrl.trim() || !formApiKey.trim()}
                            >
                                {fetching ? t('customProvider.fetching') : t('customProvider.fetchModels')}
                            </Button>
                        </div>

                        {fetchedModels.length > 0 ? (
                            <div className="border border-[#F3F4F9] rounded-[8px] p-[12px] max-h-[300px] overflow-y-auto">
                                <div className="text-[12px] text-[#C2C2C2] mb-[8px]">
                                    {t('customProvider.selectModelsHint')}
                                </div>
                                <Checkbox.Group
                                    value={selectedModels}
                                    onChange={setSelectedModels}
                                    className="flex flex-col gap-[8px]"
                                >
                                    {fetchedModels.map(model => (
                                        <Checkbox key={model} value={model} className="text-[14px]">
                                            {model}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            </div>
                        ) : (
                            <div className="text-[12px] text-[#C2C2C2] py-[24px] text-center">
                                {t('customProvider.fetchHint')}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-[12px] mt-[8px]">
                        <Button onClick={closeModal} size="large">{t('common.cancel')}</Button>
                        <Button
                            type="primary"
                            onClick={handleSave}
                            loading={saving}
                            size="large"
                            className="bg-[#0A4DFE]"
                        >
                            {editingId ? t('common.update') : t('customProvider.add')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
