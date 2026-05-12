'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Shield, ShieldCheck, X, Eye, EyeOff, Loader2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => [data.user, ...prev]);
      setForm({ name: '', email: '', password: '', role: 'user' });
      setShowCreateForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole as 'admin' | 'user' } : u));
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            Panel de Administración
          </h1>
          <p className="text-navy-400 text-sm mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-400" />
            Crear Nuevo Usuario
          </h2>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy-300">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="Ana García"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy-300">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="ana@ejemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy-300">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                    minLength={6}
                    className="input-field pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy-300">Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as 'admin' | 'user' }))}
                  className="input-field"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-800/80">
          <h2 className="font-semibold text-navy-100 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-navy-800/60">
            {users.map(user => (
              <div key={user._id} className="flex items-center gap-4 px-6 py-4 hover:bg-navy-900/40 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 border border-navy-700">
                  <span className="text-sm font-bold text-navy-300">
                    {user.name[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{user.name}</p>
                    <span className={user.role === 'admin' ? 'badge-admin' : 'badge-user'}>
                      {user.role === 'admin' ? '★ Admin' : 'Usuario'}
                    </span>
                  </div>
                  <p className="text-sm text-navy-400 truncate">{user.email}</p>
                </div>

                {/* Date */}
                <p className="text-xs text-navy-500 hidden md:block flex-shrink-0">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleRole(user._id, user.role)}
                    className="text-navy-500 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-navy-800"
                    title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  >
                    {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteUser(user._id)}
                    disabled={deletingId === user._id}
                    className="text-navy-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-navy-800"
                    title="Eliminar usuario"
                  >
                    {deletingId === user._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="p-8 text-center text-navy-500">
                No hay usuarios registrados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
