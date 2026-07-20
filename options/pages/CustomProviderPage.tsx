import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
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

export default function CustomProviderPage() {
    const [providers, setProviders] = useStorage<CustomProviderConfig[]>(CUSTOM_PROVIDERS_STORAGE_KEY, []);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const {messageApi} = useContext(OptionsContext);

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
            messageApi.warning('Please enter the API URL first.');
            return;
        }
        if (!key) {
            messageApi.warning('Please enter the API Key first.');
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
            messageApi.success(`Found ${models.length} models`);
        } catch (err: any) {
            messageApi.error(`Failed to fetch models: ${err.message}`);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            messageApi.warning('Please enter a provider name.');
            return;
        }
        if (!formApiUrl.trim()) {
            messageApi.warning('Please enter the API URL.');
            return;
        }
        if (!formApiKey.trim()) {
            messageApi.warning('Please enter the API Key.');
            return;
        }
        if (selectedModels.length === 0) {
            messageApi.warning('Please select at least one model.');
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
                messageApi.success('Provider updated');
            } else {
                await setProviders([...providers, config]);
                messageApi.success('Provider added');
            }

            closeModal();
        } catch (err: any) {
            messageApi.error(`Save failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (provider: CustomProviderConfig) => {
        Modal.confirm({
            title: 'Delete Provider',
            icon: <DeleteOutlined style={{color: '#FF2D10'}}/>,
            content: `Are you sure you want to delete "${provider.name}"? This will remove all its models from the selection list.`,
            okText: 'Delete',
            okButtonProps: {danger: true},
            cancelText: 'Cancel',
            onOk: async () => {
                clearCachedClassesForProvider(provider.id);
                const filtered = providers.filter(p => p.id !== provider.id);
                await setProviders(filtered);
                messageApi.success('Provider deleted');
            },
        });
    };

    const columns = [
        {
            title: 'Provider',
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
            title: 'API URL',
            dataIndex: 'apiUrl',
            key: 'apiUrl',
            render: (url: string) => (
                <Tooltip title={url}>
                    <span className="text-[#5E5E5E] max-w-[300px] block truncate">{url}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Models',
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
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: CustomProviderConfig) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined/>} onClick={() => openEditModal(record)}/>
                    </Tooltip>
                    <Tooltip title="Delete">
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
                    Custom Providers
                </div>
                <div className="text-[#5E5E5E] font-[400] text-[12px] justify-start mt-[8px] mb-[24px]">
                    Add your own OpenAI-compatible API providers. Configure API URL, API Key, and select the models you
                    want to use in the sidebar.
                </div>

                {providers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-[60px] text-[#C2C2C2]">
                        <ApiOutlined style={{fontSize: 48, color: '#D9D9D9'}}/>
                        <div className="mt-[16px] text-[16px]">No custom providers configured yet.</div>
                        <div className="mt-[8px] text-[12px]">Click the button below to add your first provider.</div>
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
                    Add Provider
                </Button>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editingId ? 'Edit Provider' : 'Add Provider'}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
                width={640}
                destroyOnClose
            >
                <div className="flex flex-col gap-[16px] mt-[16px]">
                    {/* Name */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">Provider Name</div>
                        <Input
                            prefix={<ApiOutlined className="text-[#C2C2C2]"/>}
                            placeholder="e.g. My OpenAI Proxy"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* API URL */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">API URL</div>
                        <Input
                            prefix={<LinkOutlined className="text-[#C2C2C2]"/>}
                            placeholder="e.g. https://api.openai.com/v1"
                            value={formApiUrl}
                            onChange={e => setFormApiUrl(e.target.value)}
                            size="large"
                        />
                        <div className="text-[12px] text-[#C2C2C2] mt-[4px]">
                            The base URL of the OpenAI-compatible API (must support /v1/chat/completions and /v1/models)
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <div className="text-[14px] font-medium text-[#333333] mb-[8px]">API Key</div>
                        <Input.Password
                            prefix={<KeyOutlined className="text-[#C2C2C2]"/>}
                            placeholder="sk-..."
                            value={formApiKey}
                            onChange={e => setFormApiKey(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* Fetch Models */}
                    <div className="border-t border-[#F3F4F9] pt-[16px]">
                        <div className="flex items-center justify-between mb-[12px]">
                            <span className="text-[14px] font-medium text-[#333333]">Available Models</span>
                            <Button
                                icon={<ReloadOutlined/>}
                                onClick={handleFetchModels}
                                loading={fetching}
                                disabled={!formApiUrl.trim() || !formApiKey.trim()}
                            >
                                {fetching ? 'Fetching...' : 'Fetch Models'}
                            </Button>
                        </div>

                        {fetchedModels.length > 0 ? (
                            <div className="border border-[#F3F4F9] rounded-[8px] p-[12px] max-h-[300px] overflow-y-auto">
                                <div className="text-[12px] text-[#C2C2C2] mb-[8px]">
                                    Select the models you want to use in the sidebar:
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
                                Click "Fetch Models" to discover available models from your API endpoint.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-[12px] mt-[8px]">
                        <Button onClick={closeModal} size="large">Cancel</Button>
                        <Button
                            type="primary"
                            onClick={handleSave}
                            loading={saving}
                            size="large"
                            className="bg-[#0A4DFE]"
                        >
                            {editingId ? 'Update' : 'Add Provider'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
