import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface FileInputProps {
    files: File[]
    onFilesChange: (files: File[]) => void
    maxFiles?: number
    accept?: Record<string, string[]>
    className?: string
}

export function FileInput({
    files,
    onFilesChange,
    maxFiles = 5,
    accept,
    className,
}: FileInputProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
            onFilesChange(newFiles)
        },
        [files, maxFiles, onFilesChange]
    )

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        onFilesChange(newFiles)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        accept,
    })

    return (
        <div className={cn('space-y-4', className)}>
            <div
                {...getRootProps()}
                className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted/50 cursor-pointer',
                    isDragActive ? 'border-primary bg-muted' : 'border-muted-foreground/25'
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-primary">Click to upload</span> or
                        drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                        SVG, PNG, JPG or GIF (max. {maxFiles} files)
                    </p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <span className="truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFile(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
