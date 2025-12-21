<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import client from '$lib/api/client';
	import Spinner from '$lib/components/Spinner.svelte';

	interface User {
		id: string;
		email: string;
		role: 'ADMIN' | 'WRITER';
		createdAt: string;
	}

	// Svelte 5 Runes state
	let users = $state<User[]>([]);
	let loading = $state(true);
	let showModal = $state(false);
	let formMode = $state<'create' | 'edit'>('create');
	let error = $state('');
	let successMessage = $state('');

	// Form fields
	let formData = $state({
		email: '',
		password: '',
		role: 'WRITER' as 'WRITER' | 'ADMIN'
	});

	let editingUserId = $state('');

	onMount(async () => {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/login');
			return;
		}

		await loadUsers();
	});

	async function loadUsers() {
		loading = true;
		error = '';
		try {
			const res = await client.get('/users');
			users = res.data;
		} catch (e: any) {
			console.error(e);
			if (e.response?.status === 403) {
				error = 'Access denied. Admin privileges required.';
				setTimeout(() => goto('/admin'), 2000);
			} else {
				error = e.response?.data?.message || 'Failed to load users';
			}
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		formMode = 'create';
		formData = {
			email: '',
			password: '',
			role: 'WRITER'
		};
		error = '';
		successMessage = '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		formData = {
			email: '',
			password: '',
			role: 'WRITER'
		};
		editingUserId = '';
	}

	async function handleSubmit() {
		error = '';
		successMessage = '';

		if (formMode === 'create') {
			if (!formData.email || !formData.password) {
				error = 'Email and password are required';
				return;
			}

			if (formData.password.length < 6) {
				error = 'Password must be at least 6 characters';
				return;
			}
		}

		try {
			if (formMode === 'create') {
				await client.post('/users', formData);
				successMessage = 'User created successfully!';
			} else {
				const updateData: { role: 'ADMIN' | 'WRITER'; password?: string } = {
					role: formData.role
				};
				if (formData.password) {
					updateData.password = formData.password;
				}
				await client.put(`/users/${editingUserId}`, updateData);
				successMessage = 'User updated successfully!';
			}

			closeModal();
			await loadUsers();

			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (e: any) {
			console.error(e);
			error = e.response?.data?.message || 'Operation failed';
		}
	}

	async function deleteUser(id: string, email: string) {
		if (!confirm(`Are you sure you want to delete user ${email}?`)) {
			return;
		}

		try {
			await client.delete(`/users/${id}`);
			successMessage = 'User deleted successfully!';
			await loadUsers();

			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (e: any) {
			console.error(e);
			error = e.response?.data?.message || 'Failed to delete user';
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function getRoleBadgeClass(role: string) {
		return role === 'ADMIN'
			? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
			: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">Manage system users and their roles</p>
			</div>
			<button
				onclick={openCreateModal}
				class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
			>
				Add User
			</button>
		</div>

		<!-- Success/Error Messages -->
		{#if successMessage}
			<div
				class="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md"
			>
				{successMessage}
			</div>
		{/if}

		{#if error && !showModal}
			<div class="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
				{error}
			</div>
		{/if}

		<!-- Users Table -->
		{#if loading}
			<div class="flex justify-center py-12">
				<Spinner />
			</div>
		{:else if users.length === 0}
			<div class="text-center py-12 bg-white dark:bg-gray-900 rounded-lg shadow">
				<p class="text-gray-600 dark:text-gray-400">No users found</p>
			</div>
		{:else}
			<div class="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Email
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Role
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Created At
							</th>
							<th
								class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
						{#each users as user (user.id)}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900 dark:text-white">
										{user.email}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										ID: {user.id}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-2 py-1 text-xs font-semibold rounded-full {getRoleBadgeClass(
											user.role
										)}"
									>
										{user.role}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button
										onclick={() => deleteUser(user.id, user.email)}
										class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
									>
										Delete
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
				{formMode === 'create' ? 'Create New User' : 'Edit User'}
			</h2>

			{#if error}
				<div
					class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm"
				>
					{error}
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<!-- Email -->
				<div class="mb-4">
					<label
						for="email"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={formData.email}
						disabled={formMode === 'edit'}
						required
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="user@example.com"
					/>
				</div>

				<!-- Password -->
				<div class="mb-4">
					<label
						for="password"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Password {formMode === 'edit' ? '(leave blank to keep current)' : ''}
					</label>
					<input
						id="password"
						type="password"
						bind:value={formData.password}
						required={formMode === 'create'}
						minlength="6"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
						placeholder="Min 6 characters"
					/>
				</div>

				<!-- Role -->
				<div class="mb-6">
					<label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Role
					</label>
					<select
						id="role"
						bind:value={formData.role}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
					>
						<option value="WRITER">Writer</option>
						<option value="ADMIN">Admin</option>
					</select>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={closeModal}
						class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
					>
						{formMode === 'create' ? 'Create User' : 'Update User'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
