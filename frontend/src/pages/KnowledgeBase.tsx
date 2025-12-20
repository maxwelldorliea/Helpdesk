import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Plus, Pencil, Trash2, BookOpen, Globe, Lock } from 'lucide-react'
import type { KnowledgeBaseArticle } from '@/lib/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function KnowledgeBase() {
    const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        is_public: false
    })

    const fetchArticles = async () => {
        setLoading(true)
        try {
            const data = await api.getArticles()
            setArticles(data)
        } catch (error) {
            console.error('Failed to fetch articles:', error)
            toast.error('Failed to load articles')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchArticles()
    }, [])

    const handleOpenDialog = (article?: KnowledgeBaseArticle) => {
        if (article) {
            setEditingArticle(article)
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category || '',
                is_public: article.is_public
            })
        } else {
            setEditingArticle(null)
            setFormData({
                title: '',
                content: '',
                category: '',
                is_public: false
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingArticle) {
                await api.updateArticle(editingArticle.id, formData)
                toast.success('Article updated successfully')
            } else {
                await api.createArticle(formData)
                toast.success('Article created successfully')
            }
            setIsDialogOpen(false)
            fetchArticles()
        } catch (error) {
            console.error('Failed to save article:', error)
            toast.error('Failed to save article')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this article?')) return
        try {
            await api.deleteArticle(id)
            toast.success('Article deleted successfully')
            fetchArticles()
        } catch (error) {
            console.error('Failed to delete article:', error)
            toast.error('Failed to delete article')
        }
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                        <p className="text-muted-foreground">
                            Manage articles and documentation for customers and agents.
                        </p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Article
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            All Articles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articles.map((article) => (
                                        <TableRow key={article.id}>
                                            <TableCell className="font-medium">{article.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{article.category || 'Uncategorized'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {article.is_public ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <Globe className="h-3 w-3" />
                                                        <span className="text-xs">Public</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Lock className="h-3 w-3" />
                                                        <span className="text-xs">Private</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(article)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(article.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {articles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No articles found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingArticle ? 'Edit Article' : 'Add Article'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Article title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Billing, Technical"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content (Markdown)</label>
                                <Textarea
                                    required
                                    className="min-h-[200px]"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Write your article content here..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_public" className="text-sm font-medium">
                                    Make this article public
                                </label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingArticle ? 'Save Changes' : 'Create Article'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    )
}
