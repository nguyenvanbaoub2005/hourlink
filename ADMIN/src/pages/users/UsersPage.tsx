import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Search, Filter, ShieldAlert, BadgeCheck, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw, Plus, Edit, Eye, KeyRound, UserX } from 'lucide-react';
import UserFormModal from './components/UserFormModal';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { usersApi, type AdminUserResponse } from '@/api/users';

const columnHelper = createColumnHelper<AdminUserResponse>();

export default function UsersPage() {
  const navigate = useNavigate();
  
  const [data, setData] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    name: '', email: '', phone: '', userType: '', locked: '' as boolean | '', verified: '' as boolean | ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserResponse | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUserResponse | null>(null);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await usersApi.getUsers(
        page, size, 
        filters.name, filters.email, filters.phone,
        filters.userType, filters.locked, filters.verified
      );
      setData(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setData([]);
      setTotalPages(0);
      setTotalElements(0);
      setFetchError('Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối Backend rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size, filters]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'stt',
        header: 'STT',
        cell: (info) => (
          <span className="text-text-muted font-medium">
            {page * size + info.row.index + 1}
          </span>
        ),
      }),
      columnHelper.accessor('fullName', {
        header: 'Họ và tên',
        cell: (info) => (
          <div className="flex items-center gap-3">
            {info.row.original.avatarUrl ? (
              <img 
                src={info.row.original.avatarUrl} 
                alt={info.getValue()} 
                className="w-9 h-9 rounded-full object-cover shadow-sm border border-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {info.getValue().charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-text">{info.getValue()}</div>
              <div className="text-xs text-text-muted mt-0.5">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Số điện thoại',
        cell: (info) => info.getValue() || <span className="text-text-muted italic">Chưa cập nhật</span>,
      }),
      columnHelper.accessor('userType', {
        header: 'Loại tài khoản',
        cell: (info) => (
          <span className="inline-block px-2 py-1 bg-surface-2 rounded-md text-[13px] font-semibold text-text">
            {info.getValue() === 'organization' ? 'Tổ chức' : 'Cá nhân'}
          </span>
        ),
      }),
      columnHelper.accessor('reputationScore', {
        header: 'Uy tín',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <span className="font-bold text-warning">{info.getValue()}</span>
            <span className="text-xs text-text-muted">/ 5.0</span>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex flex-col gap-1.5 items-start">
              {user.verified ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-md">
                  <BadgeCheck size={13}/> Đã xác thực
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-text-muted bg-surface-2 px-2 py-0.5 rounded-md border border-border">
                   Chưa xác thực
                </span>
              )}
              {user.locked && (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-md">
                  <ShieldAlert size={13}/> Đã bị khoá
                </span>
              )}
              {user.deleted && (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  <UserX size={13}/> Đã vô hiệu hóa
                </span>
              )}
            </div>
          );
        }
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(user);
                  setUserFormMode('edit');
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
                title={`Chỉnh sửa ${user.fullName}`}
              >
                <Edit size={15} />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/users/${user.id}`);
                }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition"
                title={`Xem chi tiết ${user.fullName}`}
              >
                <Eye size={15} />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setResetPasswordUser(user);
                }}
                className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-muted hover:text-amber-600 transition"
                title={`Cấp lại mật khẩu cho ${user.fullName}`}
              >
                <KeyRound size={15} />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteUserTarget(user);
                }}
                className="p-1.5 rounded-lg hover:bg-red-100 text-text-muted hover:text-danger transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                title={`Vô hiệu hóa tài khoản ${user.fullName}`}
                disabled={user.deleted}
                aria-disabled={user.deleted}
              >
                <UserX size={15} />
              </button>
            </div>
          );
        }
      })
    ],
    [navigate, page, size]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderPaginationNumbers = () => {
    let pages = [];
    const maxVisible = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(0, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition ${page === i ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-2 hover:text-text'}`}
        >
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Quản lý Người dùng</h1>
          <p className="text-sm text-text-muted">Xem, tìm kiếm và quản lý toàn bộ tài khoản người dùng HourLink.</p>
        </div>
        <button 
          onClick={() => { setUserFormMode('create'); setEditingUser(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Thêm người dùng
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        {/* Filter Bar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1: Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo Tên..." 
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo Email..." 
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo SĐT..." 
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Selects & Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-full md:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <select 
                  className="pl-9 pr-8 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full"
                  value={filters.userType}
                  onChange={(e) => handleFilterChange('userType', e.target.value)}
                >
                  <option value="">Loại tài khoản: Tất cả</option>
                  <option value="INDIVIDUAL">Cá nhân</option>
                  <option value="ORGANIZATION">Tổ chức</option>
                </select>
              </div>
              <div className="relative w-full md:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <select 
                  className="pl-9 pr-8 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full"
                  value={filters.locked.toString()}
                  onChange={(e) => handleFilterChange('locked', e.target.value === '' ? '' : e.target.value === 'true')}
                >
                  <option value="">Hoạt động: Tất cả</option>
                  <option value="false">Đang hoạt động</option>
                  <option value="true">Đã bị khoá</option>
                </select>
              </div>
              <div className="relative w-full md:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <select 
                  className="pl-9 pr-8 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text appearance-none cursor-pointer transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full"
                  value={filters.verified.toString()}
                  onChange={(e) => handleFilterChange('verified', e.target.value === '' ? '' : e.target.value === 'true')}
                >
                  <option value="">Xác thực: Tất cả</option>
                  <option value="true">Đã xác thực</option>
                  <option value="false">Chưa xác thực</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  setFilters({ name: '', email: '', phone: '', userType: '', locked: '', verified: '' });
                  setPage(0);
                }}
                className="w-9 h-9 flex items-center justify-center text-text-muted bg-surface-2 border border-border rounded-lg hover:bg-surface-hover hover:text-text transition shrink-0"
                title="Làm mới bộ lọc"
              >
                <RotateCcw size={16}/>
              </button>
            </div>
            
            <div className="flex justify-end">
              <p className="text-sm text-text-muted">
                {totalElements > 0 && <span>Tổng <strong className="text-text">{totalElements}</strong> người dùng</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="bg-surface-2 text-text font-bold text-[13px] px-4 py-3.5 border-b border-border whitespace-nowrap uppercase tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-8 text-text-muted">Đang tải dữ liệu...</td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    <p className="font-medium text-danger">{fetchError}</p>
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2"
                    >
                      <RotateCcw size={15} /> Thử lại
                    </button>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-8 text-text-muted">Không tìm thấy kết quả nào.</td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-hover group transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-text border-b border-border group-last:border-none">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-text-muted">
              Trang <span className="font-semibold text-text">{page + 1}</span> / {totalPages}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex gap-1 mx-2">
                {renderPaginationNumbers()}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={fetchUsers}
        mode={userFormMode}
        initialData={editingUser}
      />

      <Modal
        isOpen={resetPasswordUser !== null}
        title="Xác nhận cấp lại mật khẩu"
        message={`Hệ thống sẽ tạo mật khẩu ngẫu nhiên mới và gửi email tới "${resetPasswordUser?.email}". Bạn có chắc chắn không?`}
        confirmText="Cấp lại mật khẩu"
        cancelText="Hủy"
        type="warning"
        onCancel={() => setResetPasswordUser(null)}
        onConfirm={async () => {
          if (!resetPasswordUser) return;
          const user = resetPasswordUser;
          setResetPasswordUser(null);
          try {
            await usersApi.resetPassword(user.id);
            toast.success(`Đã cấp lại mật khẩu cho ${user.fullName} và gửi email thành công!`);
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể cấp lại mật khẩu');
          }
        }}
      />

      <Modal
        isOpen={deleteUserTarget !== null}
        title="Xác nhận vô hiệu hóa tài khoản"
        message={`Tài khoản "${deleteUserTarget?.fullName}" sẽ được đánh dấu ngừng hoạt động (soft delete), không bị xóa khỏi dữ liệu hệ thống. Bạn có chắc chắn không?`}
        confirmText="Vô hiệu hóa"
        cancelText="Hủy"
        type="danger"
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={async () => {
          if (!deleteUserTarget) return;
          const user = deleteUserTarget;
          setDeleteUserTarget(null);
          try {
            await usersApi.performAction(user.id, 'SOFT_DELETE');
            toast.success(`Đã vô hiệu hóa tài khoản ${user.fullName} thành công!`);
            fetchUsers();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể vô hiệu hóa tài khoản');
          }
        }}
      />
    </div>
  );
}
