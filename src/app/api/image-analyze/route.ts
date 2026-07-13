import { NextRequest } from 'next/server';
import { analyzeImage, parseSemantics, detectIndustryFromFileName } from '@/lib/image-analysis';
import { retrieveResources } from '@/lib/vector-retrieval';
import type { SemanticLayoutItem, TemplateMatch } from '@/types/editor';

/**
 * POST /api/image-analyze
 * 图生大屏 — 图片分析接口
 *
 * 流程：接收图片 → 预处理 → 语义解析 → 向量检索 → 返回完整结果
 * 对齐文档：3.1 图片预处理 → 3.2 语义解析 → 3.3 向量检索
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const supplementaryText = (formData.get('supplementaryText') as string) || '';

    if (!file) {
      return Response.json({ error: '未上传图片文件' }, { status: 400 });
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: '图片格式不支持，请上传 jpg/png/webp 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小 (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: '图片文件过大，最大支持 10MB' },
        { status: 400 }
      );
    }

    // ─── 第1步：图片预处理分析 ───
    const industryKey = detectIndustryFromFileName(file.name);
    const analysis = await analyzeImage(file);

    // ─── 第2步：多模态语义解析 ───
    const semantic = parseSemantics(analysis, industryKey, supplementaryText);

    // ─── 第3步：向量检索匹配资源 ───
    const retrieval = await retrieveResources(semantic);

    // 返回完整结果
    return Response.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      industryKey,
      analysis,
      semantic,
      retrieval,
      // 附加：为用户展示的结构化摘要
      summary: {
        industry: semantic.json.industry,
        style: semantic.json.style,
        colors: semantic.json.color,
        layout: semantic.json.layout.map((a: SemanticLayoutItem) => ({
          区域: a.area === 'top' ? '顶部标题栏' : a.area === 'left' ? '左侧看板' : a.area === 'right' ? '右侧看板' : a.area === 'center' ? '中央展示区' : '底部栏',
          宽度: a.w,
          高度: a.h,
          组件: a.component,
        })),
        materials: semantic.json.material_tags,
        matchedTemplates: retrieval.templates.map((t: TemplateMatch) => ({
          name: t.name,
          matchScore: t.matchScore,
          reason: t.reason,
        })),
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '图片分析处理异常';
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
