import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper as createSkillColumnHelper,
} from '@tanstack/react-table';
import {
  createColumnHelper as createHrColumnHelper,
} from '@tanstack/react-table';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RotateCcw, Edit, Eye,
  BookOpen, Layers, HeartHandshake, Plus, Trash2,
} from 'lucide-react';

import { skillsApi, type AdminSkillResponse, type AdminCategoryResponse, type AdminSkillDetailResponse } from '@/api/skills';
import { helpRequestsApi, type AdminHelpRequestResponse, type AdminHelpRequestDetailResponse } from '@/api/helpRequests';

import SkillDetailModal from './components/SkillDetailModal';
import CategoryEditModal from './components/CategoryEditModal';
import HelpRequestDetailModal from './components/HelpRequestDetailModal';
import CategoryFormModal from './components/CategoryFormModal';
import SkillFormModal from './components/SkillFormModal';
import HelpRequestFormModal from './components/HelpRequestFormModal';
import SkillActionModal from './components/SkillActionModal';
import Modal from '@/components/ui/Modal';

import toast from 'react-hot-toast';

// ─── Status helpers ───────────────────────────────────────────

const STATUS_CONFIG = {
  VISIBLE: { label: 'Hiển thị', color: 'text-success bg-success/10 border-success/20' },
  HIDDEN:  { label: 'Đã ẩn',   color: 'text-warning bg-warning/10 border-warning/20' },
  DELETED: { label: 'Đã xóa',  color: 'text-danger bg-danger/10 border-danger/20'    },
};

const HR_STATUS_CONFIG = {
  SEARCHING: { label: 'Đang tìm', color: 'text-primary bg-primary/10 border-primary/20' },
  ASSIGNED:  { label: 'Đã nhận',  color: 'text-info bg-info/10 border-info/20' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-success bg-success/10 border-success/20' },
  CANCELLED: { label: 'Đã hủy', color: 'text-text-muted bg-surface-2 border-border' },
  DELETED:   { label: 'Đã xóa', color: 'text-danger bg-danger/10 border-danger/20' },
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Mới',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  EXPERT: 'Chuyên gia',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Lập trình': '💻',
  'Ngôn ngữ': '🌍',
  'Thiết kế': '🎨',
  'Kinh doanh': '📊',
  'Giáo dục': '📚',
  'Sức khỏe': '💪',
  'Nghệ thuật': '🎵',
  'Khác': '✨',
};

const skillColumnHelper = createSkillColumnHelper<AdminSkillResponse>();
const hrColumnHelper = createHrColumnHelper<AdminHelpRequestResponse>();

// ─── Main Component ───────────────────────────────────────────

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'skills' | 'helpRequests'>('categories');

  // ── Skills state ──────────────────────────────────────────
  const [data, setData] = useState<AdminSkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    skillName: '', userName: '', categoryId: '', status: '', level: '', format: '',
  });

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // ── Help Requests state ───────────────────────────────────
  const [hrData, setHrData] = useState<AdminHelpRequestResponse[]>([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrPage, setHrPage] = useState(0);
  const [hrSize] = useState(10);
  const [hrTotalPages, setHrTotalPages] = useState(0);
  const [hrTotalElements, setHrTotalElements] = useState(0);

  const [hrFilters, setHrFilters] = useState({
    title: '', requesterName: '', categoryId: '', status: '',
  });

  const [selectedHrId, setSelectedHrId] = useState<string | null>(null);

  // ── Category state ────────────────────────────────────────
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [editCategory, setEditCategory] = useState<AdminCategoryResponse | null>(null);

  // ── Create/Edit Skill ─────────────────────────────────────
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillFormMode, setSkillFormMode] = useState<'create' | 'edit'>('create');
  const [editingSkillDetail, setEditingSkillDetail] = useState<AdminSkillDetailResponse | null>(null);

  // ── Create/Edit HelpRequest ───────────────────────────────
  const [showHrForm, setShowHrForm] = useState(false);
  const [hrFormMode, setHrFormMode] = useState<'create' | 'edit'>('create');
  const [editingHrDetail, setEditingHrDetail] = useState<AdminHelpRequestDetailResponse | null>(null);

  // ── Create/Edit Category ──────────────────────────────────
  const [showCatForm, setShowCatForm] = useState(false);
  const [catFormMode, setCatFormMode] = useState<'create' | 'edit'>('create');
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<AdminCategoryResponse | null>(null);

  // ── Delete targets for row actions ────────────────────────
  const [deleteSkillTarget, setDeleteSkillTarget] = useState<AdminSkillResponse | null>(null);
  const [deleteHrTarget, setDeleteHrTarget] = useState<AdminHelpRequestResponse | null>(null);

  // ── Filter helpers ────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };
  const resetFilters = () => {
    setFilters({ skillName: '', userName: '', categoryId: '', status: '', level: '', format: '' });
    setPage(0);
  };

  const handleHrFilterChange = (key: string, value: string) => {
    setHrFilters(prev => ({ ...prev, [key]: value }));
    setHrPage(0);
  };
  const resetHrFilters = () => {
    setHrFilters({ title: '', requesterName: '', categoryId: '', status: '' });
    setHrPage(0);
  };

  // ── Fetch skills ──────────────────────────────────────────
  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await skillsApi.getSkills(
        page, size,
        filters.skillName, filters.userName, filters.categoryId,
        filters.status, filters.level, filters.format
      );
      setData(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      toast.error('Không thể tải danh sách kỹ năng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (activeTab === 'skills') fetchSkills(); 
  }, [page, size, filters, activeTab]);

  // ── Fetch Help Requests ───────────────────────────────────
  const fetchHelpRequests = async () => {
    setHrLoading(true);
    try {
      const res = await helpRequestsApi.getHelpRequests(
        hrPage, hrSize, hrFilters.title, hrFilters.requesterName, hrFilters.status, hrFilters.categoryId
      );
      setHrData(res.content);
      setHrTotalPages(res.totalPages);
      setHrTotalElements(res.totalElements);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu hỗ trợ');
    } finally {
      setHrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'helpRequests') fetchHelpRequests();
  }, [hrPage, hrSize, hrFilters, activeTab]);

  // ── Fetch categories ──────────────────────────────────────
  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await skillsApi.getCategories();
      setCategories(res);
    } catch {
      toast.error('Không thể tải danh mục');
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ── Handle category save ──────────────────────────────────
  const handleCategorySave = async (name: string, description: string) => {
    if (!editCategory) return;
    await skillsApi.updateCategory(editCategory.id, { name, description });
    toast.success('Đã cập nhật danh mục thành công!');
    fetchCategories();
    setEditCategory(null);
  };

  // ── Table columns: SKILLS ─────────────────────────────────
  const skillColumns = useMemo(() => [
    skillColumnHelper.display({
      id: 'stt',
      header: 'STT',
      cell: (info) => (
        <span className="text-text-muted font-medium">
          {page * size + info.row.index + 1}
        </span>
      ),
    }),
    skillColumnHelper.accessor('name', {
      header: 'Kỹ năng',
      cell: (info) => {
        const skill = info.row.original;
        return (
          <div>
            <p className="font-semibold text-text text-sm">{info.getValue()}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {skill.categoryName && (
                <span className="text-[11px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                  {skill.categoryName}
                </span>
              )}
            </div>
          </div>
        );
      },
    }),
    skillColumnHelper.accessor('userFullName', {
      header: 'Người đăng',
      cell: (info) => {
        const skill = info.row.original;
        return (
          <div className="flex items-center gap-2">
            {skill.userAvatarUrl ? (
              <img src={skill.userAvatarUrl} alt={info.getValue()}
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {info.getValue().charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text">{info.getValue()}</p>
              <p className="text-xs text-text-muted">{skill.userEmail}</p>
            </div>
          </div>
        );
      },
    }),
    skillColumnHelper.accessor('level', {
      header: 'Trình độ',
      cell: (info) => {
        const levelStr = info.getValue();
        if (!levelStr) return <span className="text-text-muted text-sm">—</span>;
        return (
          <span className="text-sm font-medium text-text">
            {LEVEL_LABEL[levelStr] ?? levelStr}
          </span>
        );
      },
    }),
    skillColumnHelper.display({
      id: 'format',
      header: 'Hình thức',
      cell: (info) => {
        const fmt = info.row.original.format;
        if (!fmt) return <span className="text-text-muted text-sm">—</span>;
        return (
          <span className="text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
            {fmt === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
          </span>
        );
      },
    }),
    skillColumnHelper.accessor('attachmentCount', {
      header: 'Minh chứng',
      cell: (info) => (
        <span className={`text-sm font-medium ${info.getValue() > 0 ? 'text-primary' : 'text-text-muted'}`}>
          {info.getValue()} file
        </span>
      ),
    }),
    skillColumnHelper.accessor('status', {
      header: 'Trạng thái',
      cell: (info) => {
        const cfg = STATUS_CONFIG[info.getValue()] ?? STATUS_CONFIG.VISIBLE;
        return (
          <span className={`inline-block text-[12px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    }),
    skillColumnHelper.display({
      id: 'actions',
      header: 'Thao tác',
      cell: (info) => {
        const skill = info.row.original;
        return (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const detail = await skillsApi.getSkillDetail(skill.id);
                  setEditingSkillDetail(detail);
                  setSkillFormMode('edit');
                  setShowSkillForm(true);
                } catch { toast.error('Không thể tải thông tin kỹ năng'); }
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
              title={`Chỉnh sửa ${skill.name}`}
            >
              <Edit size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSkillId(skill.id);
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
              title={`Xem chi tiết ${skill.name}`}
            >
              <Eye size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteSkillTarget(skill);
              }}
              className="p-1.5 rounded-lg hover:bg-red-100 text-text-muted hover:text-danger transition"
              title={`Xóa ${skill.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    }),
  ], [page, size]);

  const skillTable = useReactTable({ data, columns: skillColumns, getCoreRowModel: getCoreRowModel() });

  // ── Table columns: HELP REQUESTS ──────────────────────────
  const hrColumns = useMemo(() => [
    hrColumnHelper.display({
      id: 'stt',
      header: 'STT',
      cell: (info) => (
        <span className="text-text-muted font-medium">
          {hrPage * hrSize + info.row.index + 1}
        </span>
      ),
    }),
    hrColumnHelper.accessor('title', {
      header: 'Tiêu đề',
      cell: (info) => {
        const hr = info.row.original;
        return (
          <div>
            <p className="font-semibold text-text text-sm max-w-xs truncate" title={info.getValue()}>{info.getValue()}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {hr.categoryName && (
                <span className="text-[11px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                  {hr.categoryName}
                </span>
              )}
            </div>
          </div>
        );
      },
    }),
    hrColumnHelper.accessor('requesterFullName', {
      header: 'Người yêu cầu',
      cell: (info) => {
        const hr = info.row.original;
        return (
          <div className="flex items-center gap-2">
            {hr.requesterAvatarUrl ? (
              <img src={hr.requesterAvatarUrl} alt={info.getValue()}
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {info.getValue().charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text">{info.getValue()}</p>
              <p className="text-xs text-text-muted">{hr.requesterEmail}</p>
            </div>
          </div>
        );
      },
    }),
    hrColumnHelper.accessor('timeCreditAmount', {
      header: 'Tín dụng',
      cell: (info) => (
        <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md font-semibold border border-primary/20">
          {info.getValue()} TC
        </span>
      ),
    }),
    hrColumnHelper.accessor('status', {
      header: 'Trạng thái',
      cell: (info) => {
        const cfg = HR_STATUS_CONFIG[info.getValue()] ?? HR_STATUS_CONFIG.SEARCHING;
        return (
          <span className={`inline-block text-[12px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    }),
    hrColumnHelper.display({
      id: 'actions',
      header: 'Thao tác',
      cell: (info) => {
        const hr = info.row.original;
        return (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const detail = await helpRequestsApi.getHelpRequestDetail(hr.id);
                  setEditingHrDetail(detail);
                  setHrFormMode('edit');
                  setShowHrForm(true);
                } catch { toast.error('Không thể tải thông tin yêu cầu'); }
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
              title={`Chỉnh sửa ${hr.title}`}
            >
              <Edit size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHrId(hr.id);
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
              title={`Xem chi tiết ${hr.title}`}
            >
              <Eye size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteHrTarget(hr);
              }}
              className="p-1.5 rounded-lg hover:bg-red-100 text-text-muted hover:text-danger transition"
              title={`Xóa ${hr.title}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    }),
  ], [hrPage, hrSize]);

  const hrTable = useReactTable({ data: hrData, columns: hrColumns, getCoreRowModel: getCoreRowModel() });

  // ── Pagination Renderers ───────────────────────────────────
  const renderPagination = (
    currentPage: number, 
    totPages: number, 
    setPageFn: (p: number | ((prev: number) => number)) => void
  ) => {
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;
    if (endPage >= totPages) { endPage = totPages - 1; startPage = Math.max(0, endPage - maxVisible + 1); }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(i => (
      <button
        key={i}
        onClick={() => setPageFn(i)}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition ${
          currentPage === i ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-2 hover:text-text'
        }`}
      >
        {i + 1}
      </button>
    ));

    return (
      <div className="flex items-center justify-between mt-5 flex-wrap gap-4">
        <p className="text-sm text-text-muted">
          Trang <strong className="text-text">{currentPage + 1}</strong> / <strong className="text-text">{totPages}</strong>
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPageFn(0)} disabled={currentPage === 0} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-2 disabled:opacity-30 transition">
            <ChevronsLeft size={16} />
          </button>
          <button onClick={() => setPageFn(p => Math.max(0, (typeof p === 'number' ? p : p) - 1))} disabled={currentPage === 0} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-2 disabled:opacity-30 transition">
            <ChevronLeft size={16} />
          </button>
          {pages}
          <button onClick={() => setPageFn(p => Math.min(totPages - 1, (typeof p === 'number' ? p : p) + 1))} disabled={currentPage >= totPages - 1} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-2 disabled:opacity-30 transition">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setPageFn(totPages - 1)} disabled={currentPage >= totPages - 1} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-2 disabled:opacity-30 transition">
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text mb-1">Quản lý Kỹ năng & Hỗ trợ</h1>
        <p className="text-sm text-text-muted">Kiểm duyệt, ẩn và xoá kỹ năng hoặc yêu cầu hỗ trợ vi phạm.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('categories')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Layers size={16} /> Danh mục
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'skills' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <BookOpen size={16} /> Danh sách kỹ năng
        </button>
        <button
          onClick={() => setActiveTab('helpRequests')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'helpRequests' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <HeartHandshake size={16} /> Yêu cầu hỗ trợ
        </button>
      </div>

      {/* ─── TAB: KỸ NĂNG ─────────────────────────────────────── */}
      {activeTab === 'skills' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Header with + button */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text">Danh sách kỹ năng</p>
              <button
                onClick={() => { setSkillFormMode('create'); setEditingSkillDetail(null); setShowSkillForm(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                <Plus size={15} /> Thêm kỹ năng
              </button>
            </div>
            {/* Row 1: Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Tìm tên kỹ năng..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={filters.skillName}
                  onChange={(e) => handleFilterChange('skillName', e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Tìm người đăng..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={filters.userName}
                  onChange={(e) => handleFilterChange('userName', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Selects & Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={filters.categoryId || ''}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  >
                    <option value="">Danh mục: Tất cả</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Trạng thái: Tất cả</option>
                    <option value="VISIBLE">Đang hiển thị</option>
                    <option value="HIDDEN">Đã ẩn</option>
                    <option value="DELETED">Đã xóa</option>
                  </select>
                </div>

                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                  >
                    <option value="">Trình độ: Tất cả</option>
                    <option value="BEGINNER">Mới bắt đầu</option>
                    <option value="INTERMEDIATE">Trung cấp</option>
                    <option value="ADVANCED">Nâng cao</option>
                    <option value="EXPERT">Chuyên gia</option>
                  </select>
                </div>

                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={filters.format}
                    onChange={(e) => handleFilterChange('format', e.target.value)}
                  >
                    <option value="">Hình thức: Tất cả</option>
                    <option value="ONLINE">Trực tuyến</option>
                    <option value="OFFLINE">Trực tiếp</option>
                  </select>
                </div>

                <button
                  onClick={resetFilters}
                  title="Đặt lại bộ lọc"
                  className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text bg-surface-2 hover:bg-border border border-border rounded-lg transition shrink-0"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <p className="text-sm text-text-muted">
                {totalElements > 0 && <span>Tổng <strong className="text-text">{totalElements}</strong> kỹ năng</span>}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                {skillTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-surface-2 border-b border-border">
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-muted">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <BookOpen className="mx-auto mb-3 text-text-muted opacity-30" size={40} />
                      <p className="text-sm text-text-muted font-medium">Không tìm thấy kỹ năng nào</p>
                    </td>
                  </tr>
                ) : (
                  skillTable.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-2 transition-colors cursor-pointer"
                      onClick={() => setSelectedSkillId(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && renderPagination(page, totalPages, setPage)}
        </div>
      )}

      {/* ─── TAB: YÊU CẦU HỖ TRỢ ──────────────────────────────── */}
      {activeTab === 'helpRequests' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Header with + button */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text">Danh sách yêu cầu hỗ trợ</p>
              <button
                onClick={() => { setHrFormMode('create'); setEditingHrDetail(null); setShowHrForm(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition"
              >
                <Plus size={15} /> Tạo yêu cầu
              </button>
            </div>
            {/* Row 1: Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Tìm tiêu đề yêu cầu..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={hrFilters.title}
                  onChange={(e) => handleHrFilterChange('title', e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Tìm người yêu cầu..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={hrFilters.requesterName}
                  onChange={(e) => handleHrFilterChange('requesterName', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Selects & Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={hrFilters.categoryId || ''}
                    onChange={(e) => handleHrFilterChange('categoryId', e.target.value)}
                  >
                    <option value="">Danh mục: Tất cả</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <select
                    className="pl-9 pr-8 py-2 w-full bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={hrFilters.status}
                    onChange={(e) => handleHrFilterChange('status', e.target.value)}
                  >
                    <option value="">Trạng thái: Tất cả</option>
                    <option value="SEARCHING">Đang tìm</option>
                    <option value="ASSIGNED">Đã nhận</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="DELETED">Đã xóa</option>
                  </select>
                </div>

                <button
                  onClick={resetHrFilters}
                  title="Đặt lại bộ lọc"
                  className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text bg-surface-2 hover:bg-border border border-border rounded-lg transition shrink-0"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="flex justify-end">
                <p className="text-sm text-text-muted">
                  {hrTotalElements > 0 && <span>Tổng <strong className="text-text">{hrTotalElements}</strong> yêu cầu</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                {hrTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-surface-2 border-b border-border">
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {hrLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-muted">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : hrData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <HeartHandshake className="mx-auto mb-3 text-text-muted opacity-30" size={40} />
                      <p className="text-sm text-text-muted font-medium">Không tìm thấy yêu cầu hỗ trợ nào</p>
                    </td>
                  </tr>
                ) : (
                  hrTable.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-2 transition-colors cursor-pointer"
                      onClick={() => setSelectedHrId(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {hrTotalPages > 1 && renderPagination(hrPage, hrTotalPages, setHrPage)}
        </div>
      )}

      {/* ─── TAB: DANH MỤC ────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-text">{categories.length} danh mục</p>
              <p className="text-xs text-text-muted mt-0.5">Thêm mới, chỉnh sửa tên và mô tả danh mục.</p>
            </div>
            <button
              onClick={() => { setCatFormMode('create'); setEditCategory(null); setShowCatForm(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              <Plus size={15} /> Thêm danh mục
            </button>
          </div>

          {catLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-start justify-between p-4 bg-surface-2 rounded-xl border border-border hover:border-primary/40 transition group gap-4"
                >
                  <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-border/50">
                    {CATEGORY_ICONS[cat.name] || '💡'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text">{cat.name}</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {cat.description || <span className="italic">Chưa có mô tả</span>}
                    </p>

                    <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-border/40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters(prev => ({ ...prev, categoryId: cat.id }));
                          setPage(0);
                          setActiveTab('skills');
                        }}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-primary/10 transition text-left group/sub"
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-700">Kỹ năng:</span>
                          <span className="text-success font-medium">{cat.visibleSkillCount || 0} hiển thị</span>
                          <span className="text-text-muted">(tổng {cat.totalSkillCount || 0})</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary opacity-80 group-hover/sub:opacity-100 transition flex items-center gap-0.5">
                          Xem <ChevronRight size={12} />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHrFilters(prev => ({ ...prev, categoryId: cat.id }));
                          setHrPage(0);
                          setActiveTab('helpRequests');
                        }}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-amber-500/10 transition text-left group/sub"
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-700">Yêu cầu hỗ trợ:</span>
                          <span className="text-amber-600 font-medium">{cat.activeHelpRequestCount || 0} đang tìm</span>
                          <span className="text-text-muted">(tổng {cat.totalHelpRequestCount || 0})</span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-600 opacity-80 group-hover/sub:opacity-100 transition flex items-center gap-0.5">
                          Xem <ChevronRight size={12} />
                        </span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCatFormMode('edit');
                      setEditCategory(cat);
                      setShowCatForm(true);
                    }}
                    className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition opacity-0 group-hover:opacity-100 shrink-0"
                    title={`Chỉnh sửa ${cat.name}`}
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCategoryTarget(cat);
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 text-text-muted hover:text-danger transition opacity-0 group-hover:opacity-100 shrink-0"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SkillDetailModal
        skillId={selectedSkillId}
        onClose={() => setSelectedSkillId(null)}
        onActionDone={fetchSkills}
      />
      
      <HelpRequestDetailModal
        requestId={selectedHrId}
        onClose={() => setSelectedHrId(null)}
        onActionDone={fetchHelpRequests}
      />

      <CategoryEditModal
        isOpen={editCategory !== null && !showCatForm}
        onClose={() => setEditCategory(null)}
        onSave={handleCategorySave}
        category={editCategory}
      />

      <CategoryFormModal
        isOpen={showCatForm}
        onClose={() => setShowCatForm(false)}
        onSuccess={() => { fetchCategories(); setShowCatForm(false); }}
        mode={catFormMode}
        initialData={catFormMode === 'edit' ? editCategory : null}
      />

      <SkillFormModal
        isOpen={showSkillForm}
        onClose={() => setShowSkillForm(false)}
        onSuccess={() => { fetchSkills(); setShowSkillForm(false); }}
        mode={skillFormMode}
        initialData={editingSkillDetail}
        categories={categories}
      />

      <HelpRequestFormModal
        isOpen={showHrForm}
        onClose={() => setShowHrForm(false)}
        onSuccess={() => { fetchHelpRequests(); setShowHrForm(false); }}
        mode={hrFormMode}
        initialData={editingHrDetail}
        categories={categories}
      />

      <Modal
        isOpen={deleteCategoryTarget !== null}
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${deleteCategoryTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa danh mục"
        cancelText="Hủy"
        type="danger"
        onCancel={() => setDeleteCategoryTarget(null)}
        onConfirm={async () => {
          if (!deleteCategoryTarget) return;
          const cat = deleteCategoryTarget;
          setDeleteCategoryTarget(null);
          try {
            await skillsApi.deleteCategory(cat.id);
            toast.success('Đã xóa danh mục thành công!');
            fetchCategories();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xóa danh mục');
          }
        }}
      />

      {deleteSkillTarget && (
        <SkillActionModal
          isOpen={true}
          onClose={() => setDeleteSkillTarget(null)}
          actionType="DELETE"
          skillName={deleteSkillTarget.name}
          onConfirm={async () => {
            await skillsApi.performAction(deleteSkillTarget.id, 'DELETE');
            toast.success('Đã xóa kỹ năng thành công!');
            fetchSkills();
          }}
        />
      )}

      {deleteHrTarget && (
        <SkillActionModal
          isOpen={true}
          onClose={() => setDeleteHrTarget(null)}
          actionType="DELETE"
          skillName={deleteHrTarget.title}
          onConfirm={async () => {
            await helpRequestsApi.performAction(deleteHrTarget.id, 'DELETE');
            toast.success('Đã xóa yêu cầu hỗ trợ thành công!');
            fetchHelpRequests();
          }}
        />
      )}
    </div>
  );
}
